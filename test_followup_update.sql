-- Test updating a follow-up directly in the database
-- First, let's see what follow-ups exist
SELECT id, lead_id, scheduled_at, completed_at, outcome FROM follow_ups ORDER BY id LIMIT 5;

-- Now let's manually set completedAt for a follow-up
-- UPDATE follow_ups 
-- SET completed_at = NOW()
-- WHERE id = 8;

--SELECT id, lead_id, scheduled_at, completed_at, outcome FROM follow_ups WHERE id = 8;
