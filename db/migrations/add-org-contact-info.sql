-- Migration: Add organization contact information fields
-- Date: 2026-01-05
-- Description: Add phone, address, city, state, and pincode fields to organizations table

-- Add contact information columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_phone ON organizations(phone);

-- Add comment to document the purpose
COMMENT ON COLUMN organizations.phone IS 'Organization primary contact phone number';
COMMENT ON COLUMN organizations.address IS 'Organization street address';
COMMENT ON COLUMN organizations.city IS 'Organization city';
COMMENT ON COLUMN organizations.state IS 'Organization state';
COMMENT ON COLUMN organizations.pincode IS 'Organization PIN/ZIP code';
