-- Simplest version - Run this in Supabase SQL Editor
-- No foreign key constraints, works standalone

-- Step 1: Create the table (without foreign key)
CREATE TABLE IF NOT EXISTS organization_holidays (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    is_repeating BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    UNIQUE(organization_id, holiday_date)
);

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_org_holidays_date ON organization_holidays(organization_id, holiday_date);

-- Step 3: Insert holidays for organization ID 1 (change this to your actual org ID)
INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
VALUES 
    (1, '2026-01-26', 'Republic Day', true, 'system'),
    (1, '2026-08-15', 'Independence Day', true, 'system'),
    (1, '2026-10-02', 'Gandhi Jayanti', true, 'system')
ON CONFLICT (organization_id, holiday_date) DO NOTHING;

-- Step 4: Verify it worked
SELECT * FROM organization_holidays;
