-- Add payment_category and charge_type columns to fee_payments table

-- Add payment_category column with default value
ALTER TABLE fee_payments 
ADD COLUMN IF NOT EXISTS payment_category VARCHAR(50) DEFAULT 'fee_payment';

-- Add charge_type column (nullable)
ALTER TABLE fee_payments 
ADD COLUMN IF NOT EXISTS charge_type VARCHAR(50);

-- Update existing records to have proper payment_category
-- EMI payments (installment_number > 0) and down payments (installment_number = 0) are fee_payment
UPDATE fee_payments 
SET payment_category = 'fee_payment' 
WHERE payment_category IS NULL AND installment_number IS NOT NULL;

-- Other existing payments default to fee_payment
UPDATE fee_payments 
SET payment_category = 'fee_payment' 
WHERE payment_category IS NULL;
