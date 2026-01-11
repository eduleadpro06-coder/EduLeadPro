-- Migration: Add UNIQUE constraint to bus_live_locations(route_id)
-- This allows for safe UPSERT (INSERT ... ON CONFLICT) operations.

-- 1. Remove any duplicate route_id entries, keeping only the most recent one
DELETE FROM bus_live_locations
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY route_id ORDER BY timestamp DESC) as row_num
        FROM bus_live_locations
    ) t
    WHERE t.row_num > 1
);

-- 2. Add the unique constraint
ALTER TABLE bus_live_locations ADD CONSTRAINT unique_route_id UNIQUE (route_id);
