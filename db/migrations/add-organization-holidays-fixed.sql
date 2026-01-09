-- Fixed migration for organization holidays
-- Using 'organizations' (plural) table name

-- Step 1: Create the table
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
CREATE INDEX IF NOT EXISTS idx_org_holidays_org ON organization_holidays(organization_id);

-- Step 3: Insert 2026 holidays for organization ID 1 (adjust ID as needed)
-- First, let's see what organizations exist
-- SELECT id, name FROM organizations;

-- Insert holidays for all existing organizations
-- Replace 'organizations' with your actual table name if different
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
        VALUES 
            (org_record.id, '2026-01-26', 'Republic Day', true, 'system'),
            (org_record.id, '2026-08-15', 'Independence Day', true, 'system'),
            (org_record.id, '2026-10-02', 'Gandhi Jayanti', true, 'system')
        ON CONFLICT (organization_id, holiday_date) DO NOTHING;
    END LOOP;
END $$;

-- Verify
SELECT COUNT(*) as total_holidays FROM organization_holidays;
SELECT * FROM organization_holidays ORDER BY holiday_date;
