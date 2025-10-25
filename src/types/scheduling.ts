// =====================================================
// Smart Scheduling System - TypeScript Types
// =====================================================

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday

export type SessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type BlockType = 'available' | 'blocked' | 'booked';

export type ReminderType = '24h' | '2h' | '30m' | 'custom' | 'prep_checklist' | 'post_session';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export type UserRole = 'student' | 'tutor';

// =====================================================
// Database Table Types
// =====================================================

export interface TutorAvailability {
  id: string;
  tutor_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorTimeBlock {
  id: string;
  tutor_id: string;
  start_datetime: string;
  end_datetime: string;
  block_type: BlockType;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TutoringSession {
  id: string;
  student_id: string;
  tutor_id: string;

  // Session details
  subject: string;
  topic?: string;
  duration_minutes: number;

  // Scheduling
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;

  // Status
  status: SessionStatus;

  // Actual times
  actual_start?: string;
  actual_end?: string;

  // Cancellation
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  rescheduled_from?: string;

  // Pricing
  price_per_hour: number;
  total_price: number;
  payment_status: PaymentStatus;
  payment_transaction_id?: string;

  // Notes
  student_notes?: string;
  tutor_notes?: string;
  homework_assigned?: string;
  files_uploaded?: any[];

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ReminderPreferences {
  id: string;
  user_id: string;

  // Channels
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;

  // Timing
  reminder_24h: boolean;
  reminder_2h: boolean;
  reminder_30m: boolean;
  reminder_custom?: number;

  // Do Not Disturb
  dnd_enabled: boolean;
  dnd_start_time?: string;
  dnd_end_time?: string;

  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: string;
  session_id: string;
  user_id: string;
  reminder_type: ReminderType;
  channel: NotificationChannel;
  status: ReminderStatus;
  sent_at?: string;
  error_message?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface NoShowHistory {
  id: string;
  session_id: string;
  user_id: string;
  user_role: UserRole;
  marked_at: string;
  marked_by?: string;
  reason?: string;
  penalty_applied: boolean;
  penalty_amount?: number;
  created_at: string;
}

export interface SessionAnalytics {
  id: string;
  user_id: string;
  user_role: UserRole;
  date: string;

  // Metrics
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;

  // Timing
  avg_response_time_minutes?: number;
  total_session_minutes: number;

  // Revenue
  total_revenue: number;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Frontend Form Types
// =====================================================

export interface AvailabilitySlot {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface BookingRequest {
  tutor_id: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  scheduled_start: string;
  timezone: string;
  price_per_hour: number;
  student_notes?: string;
}

export interface RescheduleRequest {
  session_id: string;
  new_start_time: string;
  reason?: string;
}

export interface CancellationRequest {
  session_id: string;
  reason?: string;
}

// =====================================================
// UI Component Props Types
// =====================================================

export interface AvailableTimeSlot {
  start: Date;
  end: Date;
  is_available: boolean;
  tutor_id: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: SessionStatus;
  type: 'session' | 'availability' | 'blocked';
  data?: any;
}

export interface BookingFormData {
  subject: string;
  topic: string;
  duration: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  notes: string;
}

export interface ReminderSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  timing24h: boolean;
  timing2h: boolean;
  timing30m: boolean;
  customMinutes?: number;
  dndEnabled: boolean;
  dndStart?: string;
  dndEnd?: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface AvailabilitySlotsResponse {
  slots: AvailableTimeSlot[];
  tutor_timezone: string;
}

export interface BookingResponse {
  session: TutoringSession;
  payment_required: boolean;
  payment_url?: string;
}

export interface SessionStatsResponse {
  total_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  no_show_rate: number;
  total_revenue?: number;
  avg_session_rating?: number;
}

export interface NoShowRateResponse {
  student_no_show_rate: number;
  tutor_no_show_rate: number;
  platform_avg: number;
}

// =====================================================
// Utility Types
// =====================================================

export interface TimeRange {
  start: string | Date;
  end: string | Date;
}

export interface WeeklySchedule {
  [key: number]: AvailabilitySlot[]; // key is DayOfWeek
}

export interface TutorProfile {
  id: string;
  name: string;
  avatar?: string;
  subjects: string[];
  hourly_rate: number;
  rating?: number;
  total_sessions?: number;
  response_time_minutes?: number;
}

// =====================================================
// Constants
// =====================================================

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

export const DURATION_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

export const CANCELLATION_POLICY = {
  FULL_REFUND_HOURS: 24,
  PARTIAL_REFUND_HOURS: 12,
  PARTIAL_REFUND_PERCENT: 50,
  NO_REFUND_HOURS: 12,
};
