-- Add app_password column to staff table for custom passwords
ALTER TABLE staff ADD COLUMN IF NOT EXISTS app_password VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_phone ON staff(phone);

-- Note: app_password will be NULL by default
-- When NULL, staff can login with their phone number or '1234'
-- Once they set a password, they must use that password
