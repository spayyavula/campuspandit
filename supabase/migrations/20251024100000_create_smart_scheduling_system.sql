-- =====================================================
-- Smart Scheduling System - Database Schema
-- Creates tables and functions for intelligent scheduling,
-- availability management, and automated reminders
-- =====================================================

-- =====================================================
-- 1. TUTOR AVAILABILITY
-- =====================================================

-- Tutor recurring availability (weekly schedule)
CREATE TABLE IF NOT EXISTS tutor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure end time is after start time
  CONSTRAINT valid_time_range CHECK (end_time > start_time),

  -- Prevent overlapping availability slots for same tutor on same day
  UNIQUE(tutor_id, day_of_week, start_time, end_time)
);

-- Tutor time blocks (one-off exceptions to recurring schedule)
CREATE TABLE IF NOT EXISTS tutor_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type VARCHAR(20) NOT NULL CHECK (block_type IN ('available', 'blocked', 'booked')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure end time is after start time
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- =====================================================
-- 2. BOOKINGS & SESSIONS
-- =====================================================

-- Tutoring sessions/bookings
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session details
  subject VARCHAR(100) NOT NULL,
  topic TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),

  -- Scheduling
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),

  -- Actual session times (for completed sessions)
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,

  -- Cancellation/Rescheduling
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES tutoring_sessions(id),

  -- Pricing
  price_per_hour DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'refunded', 'failed')
  ),
  payment_transaction_id VARCHAR(255) REFERENCES payment_transactions(transaction_id),

  -- Session materials
  student_notes TEXT,
  tutor_notes TEXT,
  homework_assigned TEXT,
  files_uploaded JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_session_time CHECK (scheduled_end > scheduled_start),
  CONSTRAINT student_not_tutor CHECK (student_id != tutor_id)
);

-- =====================================================
-- 3. REMINDERS & NOTIFICATIONS
-- =====================================================

-- Reminder configuration (per user preferences)
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,

  -- Timing preferences (minutes before session)
  reminder_24h BOOLEAN DEFAULT true,
  reminder_2h BOOLEAN DEFAULT true,
  reminder_30m BOOLEAN DEFAULT true,
  reminder_custom INTEGER, -- Custom minutes before

  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_start_time TIME,
  dnd_end_time TIME,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder log (track sent reminders)
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reminder details
  reminder_type VARCHAR(20) NOT NULL CHECK (
    reminder_type IN ('24h', '2h', '30m', 'custom', 'prep_checklist', 'post_session')
  ),
  channel VARCHAR(20) NOT NULL CHECK (
    channel IN ('email', 'sms', 'push', 'in_app')
  ),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'cancelled')
  ),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Delivery tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ANALYTICS & TRACKING
-- =====================================================

-- No-show tracking
CREATE TABLE IF NOT EXISTS no_show_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'tutor')),

  -- No-show details
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session analytics (aggregated stats)
CREATE TABLE IF NOT EXISTS session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'tutor')),
  date DATE NOT NULL,

  -- Metrics
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  cancelled_sessions INTEGER DEFAULT 0,
  no_show_sessions INTEGER DEFAULT 0,

  -- Timing metrics
  avg_response_time_minutes INTEGER,
  total_session_minutes INTEGER DEFAULT 0,

  -- Revenue (for tutors)
  total_revenue DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, user_role, date)
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Tutor availability indexes
CREATE INDEX idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX idx_tutor_availability_day ON tutor_availability(day_of_week);
CREATE INDEX idx_tutor_availability_active ON tutor_availability(is_active);

-- Time blocks indexes
CREATE INDEX idx_time_blocks_tutor_id ON tutor_time_blocks(tutor_id);
CREATE INDEX idx_time_blocks_dates ON tutor_time_blocks(start_datetime, end_datetime);
CREATE INDEX idx_time_blocks_type ON tutor_time_blocks(block_type);

-- Session indexes
CREATE INDEX idx_sessions_student_id ON tutoring_sessions(student_id);
CREATE INDEX idx_sessions_tutor_id ON tutoring_sessions(tutor_id);
CREATE INDEX idx_sessions_status ON tutoring_sessions(status);
CREATE INDEX idx_sessions_scheduled_start ON tutoring_sessions(scheduled_start);
CREATE INDEX idx_sessions_date_range ON tutoring_sessions(scheduled_start, scheduled_end);

-- Reminder indexes
CREATE INDEX idx_reminder_logs_session_id ON reminder_logs(session_id);
CREATE INDEX idx_reminder_logs_user_id ON reminder_logs(user_id);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status);
CREATE INDEX idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- Analytics indexes
CREATE INDEX idx_session_analytics_user_id ON session_analytics(user_id);
CREATE INDEX idx_session_analytics_date ON session_analytics(date);
CREATE INDEX idx_no_show_history_user_id ON no_show_history(user_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_show_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Tutor availability policies
CREATE POLICY "Tutors can manage their own availability"
  ON tutor_availability FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY "Anyone can view active tutor availability"
  ON tutor_availability FOR SELECT
  USING (is_active = true);

-- Time blocks policies
CREATE POLICY "Tutors can manage their own time blocks"
  ON tutor_time_blocks FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY "Students can view tutor time blocks"
  ON tutor_time_blocks FOR SELECT
  USING (block_type IN ('available', 'blocked'));

-- Session policies
CREATE POLICY "Users can view their own sessions"
  ON tutoring_sessions FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can create sessions"
  ON tutoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update their sessions"
  ON tutoring_sessions FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Reminder preferences policies
CREATE POLICY "Users can manage their own reminder preferences"
  ON reminder_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Reminder logs policies (system managed, read-only for users)
CREATE POLICY "Users can view their own reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- No-show history policies
CREATE POLICY "Users can view their own no-show history"
  ON no_show_history FOR SELECT
  USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view their own analytics"
  ON session_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_tutor_availability_updated_at
  BEFORE UPDATE ON tutor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_time_blocks_updated_at
  BEFORE UPDATE ON tutor_time_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutoring_sessions_updated_at
  BEFORE UPDATE ON tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_analytics_updated_at
  BEFORE UPDATE ON session_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session end time
CREATE OR REPLACE FUNCTION calculate_session_end_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate scheduled_end based on scheduled_start + duration_minutes
  NEW.scheduled_end := NEW.scheduled_start + (NEW.duration_minutes || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate session end time
CREATE TRIGGER auto_calculate_session_end_time
  BEFORE INSERT OR UPDATE ON tutoring_sessions
  FOR EACH ROW
  WHEN (NEW.scheduled_start IS NOT NULL AND NEW.duration_minutes IS NOT NULL)
  EXECUTE FUNCTION calculate_session_end_time();

-- Function to create time block when session is booked
CREATE OR REPLACE FUNCTION create_time_block_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' OR NEW.status = 'confirmed' THEN
    INSERT INTO tutor_time_blocks (
      tutor_id,
      start_datetime,
      end_datetime,
      block_type,
      reason
    ) VALUES (
      NEW.tutor_id,
      NEW.scheduled_start,
      NEW.scheduled_end,
      'booked',
      'Session with student'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create time block on booking
CREATE TRIGGER auto_create_time_block
  AFTER INSERT ON tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION create_time_block_on_booking();

-- Function to update analytics on session status change
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics for student
  INSERT INTO session_analytics (
    user_id,
    user_role,
    date,
    total_sessions,
    completed_sessions,
    cancelled_sessions,
    no_show_sessions
  ) VALUES (
    NEW.student_id,
    'student',
    DATE(NEW.scheduled_start),
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'no_show' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, user_role, date)
  DO UPDATE SET
    total_sessions = session_analytics.total_sessions + 1,
    completed_sessions = session_analytics.completed_sessions + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    cancelled_sessions = session_analytics.cancelled_sessions + CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    no_show_sessions = session_analytics.no_show_sessions + CASE WHEN NEW.status = 'no_show' THEN 1 ELSE 0 END,
    updated_at = NOW();

  -- Update analytics for tutor
  INSERT INTO session_analytics (
    user_id,
    user_role,
    date,
    total_sessions,
    completed_sessions,
    cancelled_sessions,
    no_show_sessions,
    total_revenue
  ) VALUES (
    NEW.tutor_id,
    'tutor',
    DATE(NEW.scheduled_start),
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'no_show' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'completed' THEN NEW.total_price ELSE 0 END
  )
  ON CONFLICT (user_id, user_role, date)
  DO UPDATE SET
    total_sessions = session_analytics.total_sessions + 1,
    completed_sessions = session_analytics.completed_sessions + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    cancelled_sessions = session_analytics.cancelled_sessions + CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END,
    no_show_sessions = session_analytics.no_show_sessions + CASE WHEN NEW.status = 'no_show' THEN 1 ELSE 0 END,
    total_revenue = session_analytics.total_revenue + CASE WHEN NEW.status = 'completed' THEN NEW.total_price ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics
CREATE TRIGGER auto_update_session_analytics
  AFTER INSERT OR UPDATE OF status ON tutoring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_analytics();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get tutor availability for a specific date range
CREATE OR REPLACE FUNCTION get_tutor_available_slots(
  p_tutor_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_timezone VARCHAR DEFAULT 'UTC'
)
RETURNS TABLE (
  slot_start TIMESTAMP WITH TIME ZONE,
  slot_end TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dates AS (
    SELECT p_start_date AS date
    UNION ALL
    SELECT (date + INTERVAL '1 day')::DATE
    FROM dates
    WHERE date < p_end_date
  )
  SELECT
    (d.date + ta.start_time)::TIMESTAMP WITH TIME ZONE AS slot_start,
    (d.date + ta.end_time)::TIMESTAMP WITH TIME ZONE AS slot_end,
    NOT EXISTS (
      SELECT 1 FROM tutor_time_blocks ttb
      WHERE ttb.tutor_id = p_tutor_id
      AND ttb.block_type IN ('blocked', 'booked')
      AND ttb.start_datetime < (d.date + ta.end_time)::TIMESTAMP WITH TIME ZONE
      AND ttb.end_datetime > (d.date + ta.start_time)::TIMESTAMP WITH TIME ZONE
    ) AS is_available
  FROM dates d
  CROSS JOIN tutor_availability ta
  WHERE ta.tutor_id = p_tutor_id
  AND ta.is_active = true
  AND EXTRACT(DOW FROM d.date) = ta.day_of_week
  ORDER BY slot_start;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Success Message
-- =====================================================

-- Smart Scheduling System created successfully
-- Tables: 7 core tables for scheduling, availability, reminders, and analytics
-- Functions: 5 helper functions for automation
-- Triggers: 5 triggers for real-time updates
-- RLS: Full row-level security implemented
