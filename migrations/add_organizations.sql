-- Migration: Add Organizations for Multi-tenant Support
-- This migration adds the organizations table and organizationId to all relevant tables

-- Step 1: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  settings JSONB, -- Stores logo, timezone, billing config, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for case-insensitive organization name lookups
CREATE INDEX IF NOT EXISTS idx_organizations_name_lower ON organizations (LOWER(name));

-- Step 2: Insert default organization for existing data
INSERT INTO organizations (name, slug, settings, is_active, created_at, updated_at)
VALUES ('Default Organization', 'default-organization', '{}', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Step 3: Add organization_id columns to all tables (nullable initially)
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE global_class_fees ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daycare_children ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daycare_inquiries ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daycare_billing_config ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daycare_enrollments ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Step 4: Assign all existing data to the default organization
UPDATE users SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE leads SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE staff SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE students SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE expenses SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE global_class_fees SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE message_templates SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE daycare_children SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE daycare_inquiries SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE daycare_billing_config SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE daycare_enrollments SET organization_id = 1 WHERE organization_id IS NULL;

-- Step 5: Create indexes for organization_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_organization_id ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_organization_id ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_global_class_fees_organization_id ON global_class_fees(organization_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_organization_id ON message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_daycare_children_organization_id ON daycare_children(organization_id);
CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_organization_id ON daycare_inquiries(organization_id);
CREATE INDEX IF NOT EXISTS idx_daycare_billing_config_organization_id ON daycare_billing_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_daycare_enrollments_organization_id ON daycare_enrollments(organization_id);

-- Step 6: Add NOT NULL constraints (only after data has been migrated)
-- NOTE: Commented out for safety - uncomment after verifying data migration
-- ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE staff ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE students ALTER COLUMN organization_id SET NOT NULL;

-- Step 7: Create helper function to get or create organization by name (case-insensitive)
CREATE OR REPLACE FUNCTION get_or_create_organization(org_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  org_id INTEGER;
  org_slug VARCHAR;
BEGIN
  -- Try to find existing organization (case-insensitive)
  SELECT id INTO org_id 
  FROM organizations 
  WHERE LOWER(name) = LOWER(org_name)
  LIMIT 1;
  
  -- If not found, create it
  IF org_id IS NULL THEN
    -- Generate slug from name
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug);
    
    -- Ensure unique slug
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    INSERT INTO organizations (name, slug, settings, is_active, created_at, updated_at)
    VALUES (org_name, org_slug, '{}', true, NOW(), NOW())
    RETURNING id INTO org_id;
  END IF;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql;
