-- =====================================================
-- Add Razorpay and Instamojo Payment Fields
-- Extends payment_transactions table to support multiple payment gateways
-- =====================================================

-- Add Razorpay fields to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);

-- Add Instamojo fields to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS instamojo_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS instamojo_payment_request_id VARCHAR(255);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_instamojo_payment_id ON payment_transactions(instamojo_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_instamojo_request_id ON payment_transactions(instamojo_payment_request_id);

-- Add comment to payment_gateway column to document supported gateways
COMMENT ON COLUMN payment_transactions.payment_gateway IS 'Payment gateway used: payu, razorpay, instamojo';

-- =====================================================
-- Success Message
-- =====================================================

-- Multi-gateway support added successfully
-- payment_transactions table now supports PayU, Razorpay, and Instamojo
