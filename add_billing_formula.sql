ALTER TABLE daycare_billing_config ADD COLUMN billing_formula TEXT DEFAULT 'Amount Due = Hourly Rate × Total Hours';
