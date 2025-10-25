-- =====================================================
-- Migrate to Stripe-Only Payment Gateway
-- Adds Stripe fields and removes old payment gateway fields
-- =====================================================

-- Add Stripe fields to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_charge_id ON payment_transactions(stripe_charge_id);

-- Update payment_gateway column comment to reflect Stripe-only support
COMMENT ON COLUMN payment_transactions.payment_gateway IS 'Payment gateway used: stripe, test';

-- =====================================================
-- Backup existing payment data (optional but recommended)
-- Create a backup table before dropping columns
-- =====================================================

-- Create backup table with all old payment data
CREATE TABLE IF NOT EXISTS payment_transactions_backup AS
SELECT * FROM payment_transactions
WHERE payment_gateway IN ('payu', 'razorpay', 'instamojo', 'shopify');

-- =====================================================
-- Remove old payment gateway fields
-- Warning: This will drop columns with old payment data
-- Make sure to backup before running this migration
-- =====================================================

-- Drop old PayU fields
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS payu_payment_id,
DROP COLUMN IF EXISTS payu_bank_ref_num;

-- Drop old Razorpay fields
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS razorpay_payment_id,
DROP COLUMN IF EXISTS razorpay_order_id,
DROP COLUMN IF EXISTS razorpay_signature;

-- Drop old Instamojo fields
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS instamojo_payment_id,
DROP COLUMN IF EXISTS instamojo_payment_request_id;

-- Drop old Shopify fields
ALTER TABLE payment_transactions
DROP COLUMN IF EXISTS shopify_checkout_id,
DROP COLUMN IF EXISTS shopify_order_id,
DROP COLUMN IF EXISTS shopify_order_number;

-- =====================================================
-- Success Message
-- =====================================================

-- Migration complete: Stripe-only payment gateway
-- Old payment data backed up in payment_transactions_backup table
-- payment_transactions table now supports only Stripe and Test payments
