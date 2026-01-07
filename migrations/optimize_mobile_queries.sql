-- Migration: Optimize Mobile App Queries
-- Purpose: Add indexes, constraints, and triggers for mobile app performance
-- Date: 2026-01-07

-- ==================================================
-- PART 1: COMPOSITE INDEXES FOR COMMON MOBILE QUERIES
-- ==================================================

-- Helper function to create index if table exists
DO $$
BEGIN
    -- Student Attendance: Most queries filter by org + date (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_attendance') THEN
        CREATE INDEX IF NOT EXISTS idx_student_attendance_org_date 
        ON student_attendance(organization_id, date DESC);
        
        CREATE INDEX IF NOT EXISTS idx_student_attendance_lead_date 
        ON student_attendance(lead_id, date DESC);
    END IF;

    -- Daily Updates: Parent app loads recent updates for a child (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'daily_updates') THEN
        CREATE INDEX IF NOT EXISTS idx_daily_updates_lead_posted 
        ON daily_updates(lead_id, posted_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_daily_updates_org_posted 
        ON daily_updates(organization_id, posted_at DESC);
    END IF;

    -- Fee Payments: Payment history for a student
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fee_payments') THEN
        CREATE INDEX IF NOT EXISTS idx_fee_payments_lead_date 
        ON fee_payments(lead_id, payment_date DESC);
    END IF;

    -- Bus Location: Latest location for a route (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bus_location_history') THEN
        CREATE INDEX IF NOT EXISTS idx_bus_location_route_time 
        ON bus_location_history(route_id, recorded_at DESC);
    END IF;

    -- Parent-Teacher Messages: Inbox for a student (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'parent_teacher_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_lead_created 
        ON parent_teacher_messages(lead_id, created_at DESC);
    END IF;

    -- Homework: By class and due date (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'homework') THEN
        CREATE INDEX IF NOT EXISTS idx_homework_class_due 
        ON homework(class_name, due_date DESC);
    END IF;

    -- Announcements: Active announcements by org (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'announcements') THEN
        CREATE INDEX IF NOT EXISTS idx_announcements_org_published 
        ON announcements(organization_id, published_at DESC);
    END IF;

    -- Events: Upcoming events by org (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'events') THEN
        CREATE INDEX IF NOT EXISTS idx_events_org_date 
        ON events(organization_id, event_date ASC);
    END IF;

    RAISE NOTICE 'Indexes created successfully for existing tables';
END $$;

-- ==================================================
-- PART 2: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ==================================================

-- Daily Updates -> Leads (if daily_updates table and lead_id column exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'daily_updates') AND
     EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'daily_updates' AND column_name = 'lead_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_daily_updates_lead'
    ) THEN
      ALTER TABLE daily_updates 
      ADD CONSTRAINT fk_daily_updates_lead 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint: fk_daily_updates_lead';
    END IF;
  END IF;
END $$;

-- Student Attendance -> Leads (if student_attendance table and lead_id column exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_attendance') AND
     EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_attendance' AND column_name = 'lead_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_attendance_lead'
    ) THEN
      ALTER TABLE student_attendance 
      ADD CONSTRAINT fk_attendance_lead 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint: fk_attendance_lead';
    END IF;
  END IF;
END $$;

-- Parent-Teacher Messages -> Leads (if parent_teacher_messages table and lead_id column exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'parent_teacher_messages') AND
     EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parent_teacher_messages' AND column_name = 'lead_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_messages_lead'
    ) THEN
      ALTER TABLE parent_teacher_messages 
      ADD CONSTRAINT fk_messages_lead 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint: fk_messages_lead';
    END IF;
  END IF;
END $$;

-- Student Bus Assignments -> Leads (if student_bus_assignments table and lead_id column exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_bus_assignments') AND
     EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_bus_assignments' AND column_name = 'lead_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_bus_assignment_lead'
    ) THEN
      ALTER TABLE student_bus_assignments 
      ADD CONSTRAINT fk_bus_assignment_lead 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added foreign key constraint: fk_bus_assignment_lead';
    END IF;
  ELSE
    RAISE NOTICE 'Skipped fk_bus_assignment_lead: table or column does not exist';
  END IF;
END $$;

-- ==================================================
-- PART 3: CREATE VIEW FOR MOBILE PARENT APP
-- ==================================================

-- Mobile Children View: Enrolled students with parent credentials
-- This view combines students and leads data for the parent mobile app
CREATE OR REPLACE VIEW mobile_children AS
SELECT 
  l.id as lead_id,
  l.name as student_name,
  l.class,
  l.parent_name,
  l.parent_phone,
  l.phone as student_phone,
  l.email as student_email,
  l.status,
  l.organization_id,
  l.app_password,
  l.created_at,
  l.updated_at
FROM leads l
WHERE l.status IN ('enrolled', 'active')
  AND l.parent_phone IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON mobile_children TO authenticated;
GRANT SELECT ON mobile_children TO anon;

-- ==================================================
-- PART 4: CACHE INVALIDATION TRIGGERS
-- ==================================================

-- Function to notify when attendance changes (for cache invalidation)
CREATE OR REPLACE FUNCTION notify_attendance_change() 
RETURNS TRIGGER AS $$
BEGIN
  -- Notify with lead_id and date so cache can be invalidated
  PERFORM pg_notify(
    'attendance_updated', 
    json_build_object(
      'lead_id', NEW.lead_id, 
      'date', NEW.date,
      'organization_id', NEW.organization_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance changes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_attendance') THEN
    DROP TRIGGER IF EXISTS attendance_notify_trigger ON student_attendance;
    CREATE TRIGGER attendance_notify_trigger 
    AFTER INSERT OR UPDATE ON student_attendance
    FOR EACH ROW 
    EXECUTE FUNCTION notify_attendance_change();
    RAISE NOTICE 'Created trigger: attendance_notify_trigger';
  END IF;
END $$;

-- Function to notify when daily update is posted
CREATE OR REPLACE FUNCTION notify_daily_update_change() 
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'daily_update_posted', 
    json_build_object(
      'lead_id', NEW.lead_id,
      'update_id', NEW.id,
      'organization_id', NEW.organization_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for daily updates (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'daily_updates') THEN
    DROP TRIGGER IF EXISTS daily_update_notify_trigger ON daily_updates;
    CREATE TRIGGER daily_update_notify_trigger 
    AFTER INSERT ON daily_updates
    FOR EACH ROW 
    EXECUTE FUNCTION notify_daily_update_change();
    RAISE NOTICE 'Created trigger: daily_update_notify_trigger';
  END IF;
END $$;

-- Function to notify bus location updates
CREATE OR REPLACE FUNCTION notify_bus_location_change() 
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'bus_location_updated', 
    json_build_object(
      'route_id', NEW.route_id,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'recorded_at', NEW.recorded_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bus location updates (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bus_location_history') THEN
    DROP TRIGGER IF EXISTS bus_location_notify_trigger ON bus_location_history;
    CREATE TRIGGER bus_location_notify_trigger 
    AFTER INSERT ON bus_location_history
    FOR EACH ROW 
    EXECUTE FUNCTION notify_bus_location_change();
    RAISE NOTICE 'Created trigger: bus_location_notify_trigger';
  END IF;
END $$;

-- ==================================================
-- PART 5: PERFORMANCE ANALYSIS HELPERS
-- ==================================================

-- Add comments to tables for documentation
COMMENT ON INDEX idx_student_attendance_org_date IS 'Mobile app: Teacher dashboard attendance queries';
COMMENT ON INDEX idx_daily_updates_lead_posted IS 'Mobile app: Parent activity feed queries';
COMMENT ON INDEX idx_bus_location_route_time IS 'Mobile app: Live bus tracking queries';
COMMENT ON VIEW mobile_children IS 'Mobile app: Parent login and children list';

-- Create function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_mobile_query_performance()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_size text,
  table_size text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    i.indexname::text,
    pg_size_pretty(pg_relation_size(i.indexrelid))::text as index_size,
    pg_size_pretty(pg_total_relation_size(t.schemaname || '.' || t.tablename))::text as table_size
  FROM pg_indexes i
  JOIN pg_tables t ON t.tablename = i.tablename
  WHERE i.indexname LIKE 'idx_%_org_%' 
     OR i.indexname LIKE 'idx_%_lead_%'
     OR i.indexname LIKE 'idx_%mobile%'
  ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM analyze_mobile_query_performance();
