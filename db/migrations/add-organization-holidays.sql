-- Create organization_holidays table
CREATE TABLE IF NOT EXISTS organization_holidays (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    is_repeating BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Ensure no duplicate holidays for same org on same date
    UNIQUE(organization_id, holiday_date)
);

-- Add index for faster queries
CREATE INDEX idx_org_holidays_date ON organization_holidays(organization_id, holiday_date);
CREATE INDEX idx_org_holidays_org ON organization_holidays(organization_id);

-- Insert common Indian national holidays for 2024
-- Note: These are sample dates, schools should customize their own holidays
INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id as organization_id,
    DATE '2024-01-26' as holiday_date,
    'Republic Day' as holiday_name,
    true as is_repeating,
    'system' as created_by
FROM organization
WHERE NOT EXISTS (
    SELECT 1 FROM organization_holidays 
    WHERE organization_id = organization.id 
    AND holiday_date = '2024-01-26'
);

INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id,
    DATE '2024-08-15',
    'Independence Day',
    true,
    'system'
FROM organization
WHERE NOT EXISTS (
    SELECT 1 FROM organization_holidays 
    WHERE organization_id = organization.id 
    AND holiday_date = '2024-08-15'
);

INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id,
    DATE '2024-10-02',
    'Gandhi Jayanti',
    true,
    'system'
FROM organization
WHERE NOT EXISTS (
    SELECT 1 FROM organization_holidays 
    WHERE organization_id = organization.id 
    AND holiday_date = '2024-10-02'
);

-- Add 2026 holidays (current year)
INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id,
    DATE '2026-01-26',
    'Republic Day',
    true,
    'system'
FROM organization;

INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id,
    DATE '2026-08-15',
    'Independence Day',
    true,
    'system'
FROM organization;

INSERT INTO organization_holidays (organization_id, holiday_date, holiday_name, is_repeating, created_by)
SELECT 
    id,
    DATE '2026-10-02',
    'Gandhi Jayanti',
    true,
    'system'
FROM organization;
