-- Bus Tracking System Database Schema
-- This migration adds tables for managing school bus routes, tracking, and student assignments

-- =====================================================
-- 1. BUS ROUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  route_name VARCHAR(255) NOT NULL,
  bus_number VARCHAR(50) NOT NULL,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  route_type VARCHAR(20) DEFAULT 'both' CHECK (route_type IN ('morning', 'evening', 'both')),
  start_time TIME,
  end_time TIME,
  capacity INTEGER DEFAULT 40,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_bus_routes_org ON bus_routes(organization_id);
CREATE INDEX idx_bus_routes_driver ON bus_routes(driver_id);
CREATE INDEX idx_bus_routes_active ON bus_routes(organization_id, active);

-- =====================================================
-- 2. BUS STOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bus_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(255) NOT NULL,
  stop_address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INTEGER NOT NULL,
  estimated_arrival_time TIME,
  geofence_radius INTEGER DEFAULT 200, -- meters
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_bus_stops_route ON bus_stops(route_id, stop_order);
CREATE INDEX idx_bus_stops_location ON bus_stops(latitude, longitude);

-- =====================================================
-- 3. STUDENT BUS ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_bus_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('pickup', 'drop', 'both')),
  active BOOLEAN DEFAULT true,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_student_bus_student ON student_bus_assignments(student_id, active);
CREATE INDEX idx_student_bus_route ON student_bus_assignments(route_id, active);
CREATE INDEX idx_student_bus_stop ON student_bus_assignments(stop_id);

-- Ensure one active assignment per student per type
CREATE UNIQUE INDEX idx_student_bus_unique_active 
  ON student_bus_assignments(student_id, assignment_type) 
  WHERE active = true;

-- =====================================================gettig
-- 4. ACTIVE BUS SESSIONS TABLE (Current Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS active_bus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('morning', 'evening')),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  current_speed DECIMAL(5, 2), -- km/h
  current_heading DECIMAL(5, 2), -- degrees (0-360)
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  current_stop_id UUID REFERENCES bus_stops(id),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_active_sessions_route ON active_bus_sessions(route_id, status);
CREATE INDEX idx_active_sessions_driver ON active_bus_sessions(driver_id, started_at DESC);
CREATE INDEX idx_active_sessions_status ON active_bus_sessions(status, started_at DESC);

-- Only one active session per route at a time
CREATE UNIQUE INDEX idx_active_session_unique_route 
  ON active_bus_sessions(route_id) 
  WHERE status = 'active';

-- =====================================================
-- 5. BUS LOCATION HISTORY TABLE (GPS Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS bus_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES active_bus_sessions(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- km/h
  heading DECIMAL(5, 2), -- degrees
  accuracy DECIMAL(6, 2), -- meters
  altitude DECIMAL(7, 2), -- meters
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Partition by date for better performance (optional but recommended)
-- CREATE TABLE bus_location_history_2026_01 PARTITION OF bus_location_history
-- FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Index for faster queries
CREATE INDEX idx_location_history_session ON bus_location_history(session_id, recorded_at DESC);
CREATE INDEX idx_location_history_route ON bus_location_history(route_id, recorded_at DESC);
CREATE INDEX idx_location_history_time ON bus_location_history(recorded_at DESC);

-- =====================================================
-- 6. BUS STOP EVENTS TABLE (Arrival/Departure)
-- =====================================================
CREATE TABLE IF NOT EXISTS bus_stop_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES active_bus_sessions(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('arrived', 'departed')),
  event_time TIMESTAMP DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  students_boarded INTEGER DEFAULT 0,
  notes TEXT
);

-- Index for faster queries
CREATE INDEX idx_stop_events_session ON bus_stop_events(session_id, event_time);
CREATE INDEX idx_stop_events_stop ON bus_stop_events(stop_id, event_time DESC);

-- =====================================================
-- 7. PARENT DEVICE TOKENS (For Push Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS parent_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android')),
  device_name VARCHAR(255),
  active BOOLEAN DEFAULT true,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_device_tokens_user ON parent_device_tokens(user_id, active);
CREATE UNIQUE INDEX idx_device_tokens_unique ON parent_device_tokens(device_token) WHERE active = true;

-- =====================================================
-- 8. MOBILE APP NOTIFICATIONS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS mobile_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  delivered BOOLEAN DEFAULT false
);

-- Index for faster queries
CREATE INDEX idx_mobile_notif_user ON mobile_notifications(user_id, sent_at DESC);
CREATE INDEX idx_mobile_notif_unread ON mobile_notifications(user_id, read_at) WHERE read_at IS NULL;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bus_routes
CREATE TRIGGER update_bus_routes_updated_at
  BEFORE UPDATE ON bus_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for student_bus_assignments
CREATE TRIGGER update_student_bus_assignments_updated_at
  BEFORE UPDATE ON student_bus_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  r DECIMAL := 6371; -- Earth radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon/2) * SIN(dlon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN r * c * 1000; -- Return distance in meters
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SAMPLE DATA (Optional - for development/testing)
-- =====================================================
-- Uncomment to insert sample data

-- INSERT INTO bus_routes (organization_id, route_name, bus_number, route_type, start_time, capacity)
-- VALUES 
--   ((SELECT id FROM organizations LIMIT 1), 'Route A - North', 'BUS-101', 'both', '08:00:00', 45),
--   ((SELECT id FROM organizations LIMIT 1), 'Route B - South', 'BUS-102', 'both', '08:15:00', 40);

-- =====================================================
-- GRANTS (Adjust based on your security model)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE bus_routes IS 'Stores school bus routes with driver assignments';
COMMENT ON TABLE bus_stops IS 'Individual stops for each route with GPS coordinates';
COMMENT ON TABLE student_bus_assignments IS 'Maps students to their pickup/drop stops';
COMMENT ON TABLE active_bus_sessions IS 'Current active tracking sessions (real-time data)';
COMMENT ON TABLE bus_location_history IS 'Historical GPS trail for all bus trips';
COMMENT ON TABLE bus_stop_events IS 'Log of bus arrivals and departures at stops';
COMMENT ON TABLE parent_device_tokens IS 'FCM tokens for push notifications to parent devices';
COMMENT ON TABLE mobile_notifications IS 'Log of all notifications sent to mobile app users';
