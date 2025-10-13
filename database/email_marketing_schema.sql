-- Email Marketing Schema for CampusPandit
-- This schema creates tables for managing email subscribers and marketing preferences
-- Run this in your Supabase SQL Editor

-- Create email_subscribers table
CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    subscribed BOOLEAN NOT NULL DEFAULT true,
    consent_date TIMESTAMPTZ,
    unsubscribe_date TIMESTAMPTZ,
    source TEXT CHECK (source IN ('registration', 'profile', 'landing_page', 'manual')),
    preferences JSONB DEFAULT '{
        "course_updates": true,
        "tournament_notifications": true,
        "weekly_digest": true,
        "promotional_offers": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);

-- Create index on user_id for user lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON email_subscribers(user_id);

-- Create index on subscribed status for filtering
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed ON email_subscribers(subscribed);

-- Create index on source for analytics
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_email_subscribers_updated_at ON email_subscribers;
CREATE TRIGGER update_email_subscribers_updated_at
    BEFORE UPDATE ON email_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriber record
CREATE POLICY "Users can view own subscriber record"
    ON email_subscribers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own subscriber record
CREATE POLICY "Users can update own subscriber record"
    ON email_subscribers
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriber record
CREATE POLICY "Users can insert own subscriber record"
    ON email_subscribers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all subscriber records
CREATE POLICY "Admins can view all subscriber records"
    ON email_subscribers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- Policy: Admins can update all subscriber records
CREATE POLICY "Admins can update all subscriber records"
    ON email_subscribers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- Policy: Allow public inserts for landing page signups (optional)
-- Uncomment if you want to allow anonymous signups from landing pages
-- CREATE POLICY "Allow public subscriber inserts"
--     ON email_subscribers
--     FOR INSERT
--     WITH CHECK (true);

-- Create view for subscriber statistics (admin only)
CREATE OR REPLACE VIEW subscriber_stats AS
SELECT
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
    COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
    COUNT(*) FILTER (WHERE source = 'registration') as from_registration,
    COUNT(*) FILTER (WHERE source = 'profile') as from_profile,
    COUNT(*) FILTER (WHERE source = 'landing_page') as from_landing_page,
    COUNT(*) FILTER (WHERE source = 'manual') as from_manual,
    COUNT(*) FILTER (WHERE preferences->>'course_updates' = 'true') as wants_course_updates,
    COUNT(*) FILTER (WHERE preferences->>'tournament_notifications' = 'true') as wants_tournament_notifications,
    COUNT(*) FILTER (WHERE preferences->>'weekly_digest' = 'true') as wants_weekly_digest,
    COUNT(*) FILTER (WHERE preferences->>'promotional_offers' = 'true') as wants_promotional_offers
FROM email_subscribers;

-- Grant access to subscriber_stats view for admins
GRANT SELECT ON subscriber_stats TO authenticated;

-- Create function to get subscriber stats
CREATE OR REPLACE FUNCTION get_subscriber_stats()
RETURNS TABLE (
    total_subscribers BIGINT,
    active_subscribers BIGINT,
    unsubscribed BIGINT,
    from_registration BIGINT,
    from_profile BIGINT,
    from_landing_page BIGINT,
    from_manual BIGINT,
    wants_course_updates BIGINT,
    wants_tournament_notifications BIGINT,
    wants_weekly_digest BIGINT,
    wants_promotional_offers BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM subscriber_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE email_subscribers IS 'Stores email subscriber information for marketing purposes';
COMMENT ON COLUMN email_subscribers.user_id IS 'References the authenticated user (nullable for non-users)';
COMMENT ON COLUMN email_subscribers.email IS 'Email address (unique)';
COMMENT ON COLUMN email_subscribers.subscribed IS 'Current subscription status';
COMMENT ON COLUMN email_subscribers.consent_date IS 'When the user gave consent to receive emails';
COMMENT ON COLUMN email_subscribers.unsubscribe_date IS 'When the user unsubscribed';
COMMENT ON COLUMN email_subscribers.source IS 'How the subscriber was acquired';
COMMENT ON COLUMN email_subscribers.preferences IS 'JSON object storing email preferences';

-- Sample data for testing (optional - remove in production)
-- INSERT INTO email_subscribers (email, name, subscribed, consent_date, source) VALUES
-- ('test1@example.com', 'Test User 1', true, NOW(), 'registration'),
-- ('test2@example.com', 'Test User 2', true, NOW(), 'profile'),
-- ('test3@example.com', 'Test User 3', false, NOW() - INTERVAL '30 days', 'landing_page');
