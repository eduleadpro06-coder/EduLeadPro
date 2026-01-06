-- EduLeadPro Preschool Extension - 100% SAFE - NO DATA LOSS
-- Only ADDS new features, NEVER drops or modifies existing data

-- =====================================================
-- SAFELY ADD PRESCHOOL COLUMNS TO LEADS (Optional)
-- =====================================================

-- Only ADD columns if they don't exist - existing data is untouched
ALTER TABLE leads ADD COLUMN IF NOT EXISTS section VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS batch VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_enrolled BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrollment_date DATE;

-- Safe indexes
CREATE INDEX IF NOT EXISTS idx_leads_enrolled ON leads(is_enrolled) WHERE is_enrolled = true;
CREATE INDEX IF NOT EXISTS idx_leads_class_section ON leads(class, section);

-- =====================================================
-- CREATE NEW PRESCHOOL TABLES (Only if they don't exist)
-- =====================================================

-- Daily Updates
CREATE TABLE IF NOT EXISTS daily_updates (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  media_urls TEXT[],
  activity_type VARCHAR(50),
  mood VARCHAR(20),
  teacher_name VARCHAR(100),
  class_name VARCHAR(50),
  section VARCHAR(10),
  is_pinned BOOLEAN DEFAULT false,
  posted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_updates_org ON daily_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_updates_lead ON daily_updates(lead_id);
CREATE INDEX IF NOT EXISTS idx_daily_updates_class ON daily_updates(class_name, section);
CREATE INDEX IF NOT EXISTS idx_daily_updates_posted ON daily_updates(posted_at DESC);

-- Student Attendance
CREATE TABLE IF NOT EXISTS student_attendance (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  marked_by VARCHAR(100),
  marked_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Handle existing unique constraint gracefully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_attendance_lead_id_date_key'
  ) THEN
    ALTER TABLE student_attendance ADD CONSTRAINT student_attendance_lead_id_date_key UNIQUE(lead_id, date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_attendance_lead ON student_attendance(lead_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date DESC);

-- Preschool Homework
CREATE TABLE IF NOT EXISTS preschool_homework (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(10),
  teacher_name VARCHAR(100),
  subject VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  media_urls TEXT[],
  due_date DATE,
  posted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preschool_homework_class ON preschool_homework(class_name, section);
CREATE INDEX IF NOT EXISTS idx_preschool_homework_due_date ON preschool_homework(due_date);

-- Homework Submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
  id SERIAL PRIMARY KEY,
  homework_id INTEGER NOT NULL REFERENCES preschool_homework(id) ON DELETE CASCADE,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  submission_text TEXT,
  media_urls TEXT[],
  submitted_at TIMESTAMP DEFAULT NOW(),
  feedback TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'homework_submissions_homework_id_lead_id_key'
  ) THEN
    ALTER TABLE homework_submissions ADD CONSTRAINT homework_submissions_homework_id_lead_id_key UNIQUE(homework_id, lead_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_lead ON homework_submissions(lead_id);

-- Preschool Announcements
CREATE TABLE IF NOT EXISTS preschool_announcements (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  target_roles VARCHAR(20)[],
  target_classes VARCHAR(50)[],
  created_by VARCHAR(100),
  published_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preschool_announcements_org ON preschool_announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_preschool_announcements_published ON preschool_announcements(published_at DESC);

-- Preschool Events
CREATE TABLE IF NOT EXISTS preschool_events (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  location VARCHAR(200),
  event_type VARCHAR(50),
  for_classes VARCHAR(50)[],
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preschool_events_org ON preschool_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_preschool_events_date ON preschool_events(event_date);

-- Parent-Teacher Messages
CREATE TABLE IF NOT EXISTS parent_teacher_messages (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  from_name VARCHAR(100) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(100) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  media_urls TEXT[],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  parent_message_id INTEGER REFERENCES parent_teacher_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_teacher_messages_to ON parent_teacher_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_parent_teacher_messages_lead ON parent_teacher_messages(lead_id);

-- Lead Preschool Profiles
CREATE TABLE IF NOT EXISTS lead_preschool_profiles (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  photo_url TEXT,
  blood_group VARCHAR(10),
  medical_conditions TEXT,
  allergies TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lead_preschool_profiles_lead_id_key'
  ) THEN
    ALTER TABLE lead_preschool_profiles ADD CONSTRAINT lead_preschool_profiles_lead_id_key UNIQUE(lead_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_preschool_profiles_lead ON lead_preschool_profiles(lead_id);

-- Mobile Notifications table skipped - already exists in your database
-- If you need to modify it, do it separately to avoid conflicts

-- =====================================================
-- SAFELY ADD MOBILE COLUMNS TO USERS
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- =====================================================
-- HELPER FUNCTIONS & TRIGGERS (Safe)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_daily_updates_updated_at') THEN
    CREATE TRIGGER update_daily_updates_updated_at BEFORE UPDATE ON daily_updates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_preschool_homework_updated_at') THEN
    CREATE TRIGGER update_preschool_homework_updated_at BEFORE UPDATE ON preschool_homework
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_preschool_announcements_updated_at') THEN
    CREATE TRIGGER update_preschool_announcements_updated_at BEFORE UPDATE ON preschool_announcements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_preschool_events_updated_at') THEN
    CREATE TRIGGER update_preschool_events_updated_at BEFORE UPDATE ON preschool_events
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lead_preschool_profiles_updated_at') THEN
    CREATE TRIGGER update_lead_preschool_profiles_updated_at BEFORE UPDATE ON lead_preschool_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- VERIFICATION (Read-only, safe)
-- =====================================================

SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN (
    'daily_updates', 'student_attendance', 'preschool_homework',
    'homework_submissions', 'preschool_announcements', 'preschool_events',
    'parent_teacher_messages', 'lead_preschool_profiles', 'mobile_notifications'
  )
ORDER BY tablename;

-- ✅ Schema complete - 100% safe, no data modified or deleted
