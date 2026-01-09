-- Fix bus_location_history table to use INTEGER instead of UUID for route_id
-- This migration fixes the type mismatch between bus_routes (INTEGER id) and bus_location_history (UUID route_id)

-- Drop the existing table if it exists (will lose existing data)
DROP TABLE IF EXISTS bus_location_history CASCADE;

-- Recreate with INTEGER route_id to match bus_routes table
CREATE TABLE bus_location_history (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_bus_location_history_route ON bus_location_history(route_id, recorded_at DESC);
CREATE INDEX idx_bus_location_history_time ON bus_location_history(recorded_at DESC);

-- Add comment
COMMENT ON TABLE bus_location_history IS 'Historical GPS tracking data for bus routes (uses INTEGER route_id)';
