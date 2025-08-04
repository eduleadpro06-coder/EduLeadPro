-- Fix fee_payments table by adding missing columns
-- Add discount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fee_payments' AND column_name = 'discount') THEN
        ALTER TABLE fee_payments ADD COLUMN discount numeric(10, 2) DEFAULT '0';
    END IF;
END $$;

-- Add payment_mode column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fee_payments' AND column_name = 'payment_mode') THEN
        ALTER TABLE fee_payments ADD COLUMN payment_mode varchar(20) NOT NULL DEFAULT 'cash';
    END IF;
END $$;

-- Show the updated table structure
\d fee_payments; 