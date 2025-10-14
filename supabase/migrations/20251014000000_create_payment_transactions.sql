-- =====================================================
-- Payment Transactions Table
-- Stores all payment transactions for tutor bookings and other purchases
-- =====================================================

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    product_info TEXT NOT NULL,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'payu',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    payu_payment_id VARCHAR(255),
    payu_bank_ref_num VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payu_payment_id ON payment_transactions(payu_payment_id);

-- =====================================================
-- Tutor Bookings Table (Enhanced with payment)
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours DECIMAL(3, 1) NOT NULL CHECK (duration_hours > 0),
    hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate > 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
    subject VARCHAR(100),
    notes TEXT,
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tutor_bookings
CREATE INDEX IF NOT EXISTS idx_tutor_bookings_student_id ON tutor_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_bookings_tutor_id ON tutor_bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_bookings_session_date ON tutor_bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_tutor_bookings_status ON tutor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_tutor_bookings_payment_status ON tutor_bookings(payment_status);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment transactions
DROP POLICY IF EXISTS "Users can view their own payments" ON payment_transactions;
CREATE POLICY "Users can view their own payments"
    ON payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own payment transactions (initiated by app)
DROP POLICY IF EXISTS "Users can create their own payments" ON payment_transactions;
CREATE POLICY "Users can create their own payments"
    ON payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- System can update payment transactions (for webhook callbacks)
DROP POLICY IF EXISTS "System can update payment transactions" ON payment_transactions;
CREATE POLICY "System can update payment transactions"
    ON payment_transactions FOR UPDATE
    USING (true);

-- Enable RLS on tutor_bookings
ALTER TABLE tutor_bookings ENABLE ROW LEVEL SECURITY;

-- Students can view their own bookings
DROP POLICY IF EXISTS "Students can view their bookings" ON tutor_bookings;
CREATE POLICY "Students can view their bookings"
    ON tutor_bookings FOR SELECT
    USING (auth.uid() = student_id);

-- Tutors can view their bookings
DROP POLICY IF EXISTS "Tutors can view their bookings" ON tutor_bookings;
CREATE POLICY "Tutors can view their bookings"
    ON tutor_bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tutors
            WHERE tutors.id = tutor_bookings.tutor_id
            AND tutors.user_id = auth.uid()
        )
    );

-- Students can create bookings
DROP POLICY IF EXISTS "Students can create bookings" ON tutor_bookings;
CREATE POLICY "Students can create bookings"
    ON tutor_bookings FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own bookings (before confirmation)
DROP POLICY IF EXISTS "Students can update their bookings" ON tutor_bookings;
CREATE POLICY "Students can update their bookings"
    ON tutor_bookings FOR UPDATE
    USING (auth.uid() = student_id);

-- Tutors can update their bookings (confirm/cancel)
DROP POLICY IF EXISTS "Tutors can update their bookings" ON tutor_bookings;
CREATE POLICY "Tutors can update their bookings"
    ON tutor_bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tutors
            WHERE tutors.id = tutor_bookings.tutor_id
            AND tutors.user_id = auth.uid()
        )
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment_transactions
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tutor_bookings
DROP TRIGGER IF EXISTS update_tutor_bookings_updated_at ON tutor_bookings;
CREATE TRIGGER update_tutor_bookings_updated_at
    BEFORE UPDATE ON tutor_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get payment statistics for a user
CREATE OR REPLACE FUNCTION get_user_payment_stats(p_user_id UUID)
RETURNS TABLE (
    total_spent DECIMAL,
    successful_payments BIGINT,
    failed_payments BIGINT,
    pending_payments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_spent,
        COUNT(CASE WHEN status = 'success' THEN 1 END)::BIGINT as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::BIGINT as pending_payments
    FROM payment_transactions
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Success Message
-- =====================================================

-- Payment tables and policies created successfully
-- Users can now make payments for tutor sessions and track their payment history
