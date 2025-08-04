-- Check if attended_days column exists in payroll table
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'attended_days'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE payroll ADD COLUMN attended_days INTEGER DEFAULT 30;
        RAISE NOTICE 'Added attended_days column to payroll table';
    ELSE
        RAISE NOTICE 'attended_days column already exists in payroll table';
    END IF;
END $$;

-- Show current payroll table structure
\d payroll;

-- Show sample data from payroll table
SELECT id, staff_id, month, year, basic_salary, attended_days, deductions, net_salary 
FROM payroll 
ORDER BY id DESC 
LIMIT 5; 