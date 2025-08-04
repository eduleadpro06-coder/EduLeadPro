-- Add discount column to fee_payments table
ALTER TABLE "fee_payments" ADD COLUMN "discount" numeric(10, 2) DEFAULT '0'; 