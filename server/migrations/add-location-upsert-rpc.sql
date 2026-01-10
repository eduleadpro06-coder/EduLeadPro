-- Create RPC function for location upsert with DB-controlled timestamp
CREATE OR REPLACE FUNCTION upsert_bus_location(
    p_route_id INTEGER,
    p_driver_id INTEGER,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_speed NUMERIC DEFAULT 0,
    p_heading NUMERIC DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO bus_live_locations (route_id, driver_id, latitude, longitude, speed, heading, is_active, timestamp)
    VALUES (p_route_id, p_driver_id, p_latitude, p_longitude, p_speed, p_heading, true, NOW())
    ON CONFLICT (route_id) 
    DO UPDATE SET
        driver_id = EXCLUDED.driver_id,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        speed = EXCLUDED.speed,
        heading = EXCLUDED.heading,
        is_active = true,
        timestamp = NOW();
END;
$$ LANGUAGE plpgsql;
