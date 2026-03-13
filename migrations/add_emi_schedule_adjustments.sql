-- Migration: Add scheduled_amount and carryover_amount to emi_schedule
-- These columns enable partial payment tracking and automatic carryover to next EMI

ALTER TABLE emi_schedule
  ADD COLUMN IF NOT EXISTS scheduled_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS carryover_amount NUMERIC(10,2) DEFAULT 0;

-- Backfill scheduled_amount from current amount for existing rows
UPDATE emi_schedule
  SET scheduled_amount = amount::NUMERIC
  WHERE scheduled_amount IS NULL;
