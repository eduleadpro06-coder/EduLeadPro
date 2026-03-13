-- Migration: Add discount to emi_plans
-- This column enables tracking discount applied directly to the EMI plan

ALTER TABLE emi_plans
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;
