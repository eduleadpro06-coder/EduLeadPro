-- Fix EMI Plans Foreign Key Constraint
-- This changes the emiPlans.student_id foreign key from referencing students.id to leads.id

-- Drop the existing foreign key constraint
ALTER TABLE emi_plans 
DROP CONSTRAINT IF EXISTS emi_plans_student_id_fkey;

-- Add the new foreign key constraint referencing leads table
ALTER TABLE emi_plans
ADD CONSTRAINT emi_plans_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES leads(id);
