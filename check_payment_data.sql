-- Check payment details for recent payments
SELECT id, amount, payment_mode, payment_category, charge_type, installment_number, created_at
FROM fee_payments 
WHERE id >= 61
ORDER BY id DESC;
