-- Drop the foreign key constraint from follow_ups table to allow leads to be deleted independently
-- This allows follow-ups to exist even after a lead is deleted

-- Drop the foreign key constraint
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_lead_id_fkey;

-- Add a comment to the table to document this change
COMMENT ON COLUMN follow_ups.lead_id IS 'Lead ID reference (no foreign key constraint - allows orphaned follow-ups)';

