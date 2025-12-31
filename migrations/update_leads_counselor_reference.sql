-- Migration: Update leads.counselor_id to reference staff instead of users
-- This aligns with the separation of staff (employees) and users (login accounts)

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_counselor_id_users_id_fk;

-- Step 2: Add new foreign key constraint to staff table
ALTER TABLE leads 
ADD CONSTRAINT leads_counselor_id_staff_id_fk 
FOREIGN KEY (counselor_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Note: Since the user confirmed no counselors exist in users that aren't in staff,
-- no data migration is needed. The counselor_id values should already match staff IDs.
