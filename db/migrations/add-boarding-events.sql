-- Migration: Add bus_trip_passenger_events for real-time sync
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS bus_trip_passenger_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES active_bus_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('boarded', 'dropped', 'pending')),
    event_time TIMESTAMP DEFAULT NOW()
);

-- Index for fast status lookup for the parent app
CREATE INDEX IF NOT EXISTS idx_passenger_events_student ON bus_trip_passenger_events(student_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_passenger_events_session ON bus_trip_passenger_events(session_id);

COMMENT ON TABLE bus_trip_passenger_events IS 'Log of student boarding activity for real-time sync with parent portal';
