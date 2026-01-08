-- Migration: Add bus_live_locations table for real-time GPS tracking
-- Created: 2026-01-09

-- Create bus live locations table
CREATE TABLE IF NOT EXISTS bus_live_locations (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    accuracy DECIMAL(8, 2),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bus_live_locations_route_id ON bus_live_locations(route_id);
CREATE INDEX IF NOT EXISTS idx_bus_live_locations_timestamp ON bus_live_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bus_live_locations_active ON bus_live_locations(route_id, is_active, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE bus_live_locations IS 'Stores real-time GPS locations from bus drivers for live tracking';
COMMENT ON COLUMN bus_live_locations.latitude IS 'GPS latitude coordinate (decimal degrees)';
COMMENT ON COLUMN bus_live_locations.longitude IS 'GPS longitude coordinate (decimal degrees)';
COMMENT ON COLUMN bus_live_locations.speed IS 'Current speed in km/h';
COMMENT ON COLUMN bus_live_locations.heading IS 'Direction in degrees (0-360)';
COMMENT ON COLUMN bus_live_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN bus_live_locations.is_active IS 'Whether this location is from an active tracking session';
