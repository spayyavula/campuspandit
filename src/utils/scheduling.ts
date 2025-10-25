import { supabase } from '@/lib/supabase';
import type {
  TutorAvailability,
  TutorTimeBlock,
  TutoringSession,
  ReminderPreferences,
  AvailabilitySlot,
  BookingRequest,
  RescheduleRequest,
  CancellationRequest,
  AvailableTimeSlot,
  SessionStatsResponse,
  DayOfWeek,
} from '@/types/scheduling';

// =====================================================
// TUTOR AVAILABILITY MANAGEMENT
// =====================================================

/**
 * Get tutor's recurring weekly availability
 */
export const getTutorAvailability = async (tutorId: string): Promise<TutorAvailability[]> => {
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tutor availability: ${error.message}`);
  }

  return data || [];
};

/**
 * Set tutor's recurring availability for a specific day
 */
export const setTutorAvailability = async (
  tutorId: string,
  slots: AvailabilitySlot[]
): Promise<void> => {
  // Delete existing availability
  const { error: deleteError } = await supabase
    .from('tutor_availability')
    .delete()
    .eq('tutor_id', tutorId);

  if (deleteError) {
    throw new Error(`Failed to clear existing availability: ${deleteError.message}`);
  }

  // Insert new availability slots
  const { error: insertError } = await supabase
    .from('tutor_availability')
    .insert(
      slots.map((slot) => ({
        tutor_id: tutorId,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        timezone: slot.timezone,
        is_active: true,
      }))
    );

  if (insertError) {
    throw new Error(`Failed to set availability: ${insertError.message}`);
  }
};

/**
 * Add a one-time availability block (override recurring schedule)
 */
export const addTimeBlock = async (
  tutorId: string,
  startDatetime: Date,
  endDatetime: Date,
  type: 'available' | 'blocked',
  reason?: string
): Promise<void> => {
  const { error } = await supabase.from('tutor_time_blocks').insert({
    tutor_id: tutorId,
    start_datetime: startDatetime.toISOString(),
    end_datetime: endDatetime.toISOString(),
    block_type: type,
    reason,
  });

  if (error) {
    throw new Error(`Failed to add time block: ${error.message}`);
  }
};

/**
 * Get available time slots for a tutor in a date range
 */
export const getAvailableSlots = async (
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailableTimeSlot[]> => {
  // Call the database function
  const { data, error } = await supabase.rpc('get_tutor_available_slots', {
    p_tutor_id: tutorId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
  });

  if (error) {
    throw new Error(`Failed to get available slots: ${error.message}`);
  }

  return (
    data?.map((slot: any) => ({
      start: new Date(slot.slot_start),
      end: new Date(slot.slot_end),
      is_available: slot.is_available,
      tutor_id: tutorId,
    })) || []
  );
};

// =====================================================
// SESSION BOOKING
// =====================================================

/**
 * Create a new tutoring session booking
 */
export const createBooking = async (
  studentId: string,
  bookingData: BookingRequest
): Promise<TutoringSession> => {
  // Calculate total price
  const durationHours = bookingData.duration_minutes / 60;
  const totalPrice = durationHours * bookingData.price_per_hour;

  // Calculate scheduled end time
  const scheduledStart = new Date(bookingData.scheduled_start);
  const scheduledEnd = new Date(
    scheduledStart.getTime() + bookingData.duration_minutes * 60 * 1000
  );

  const { data, error } = await supabase
    .from('tutoring_sessions')
    .insert({
      student_id: studentId,
      tutor_id: bookingData.tutor_id,
      subject: bookingData.subject,
      topic: bookingData.topic,
      duration_minutes: bookingData.duration_minutes,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      timezone: bookingData.timezone,
      price_per_hour: bookingData.price_per_hour,
      total_price: totalPrice,
      student_notes: bookingData.student_notes,
      status: 'scheduled',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return data;
};

/**
 * Get upcoming sessions for a user
 */
export const getUpcomingSessions = async (
  userId: string,
  role: 'student' | 'tutor'
): Promise<TutoringSession[]> => {
  const column = role === 'student' ? 'student_id' : 'tutor_id';
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tutoring_sessions')
    .select('*')
    .eq(column, userId)
    .gte('scheduled_start', now)
    .in('status', ['scheduled', 'confirmed'])
    .order('scheduled_start', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch upcoming sessions: ${error.message}`);
  }

  return data || [];
};

/**
 * Get session history for a user
 */
export const getSessionHistory = async (
  userId: string,
  role: 'student' | 'tutor',
  limit: number = 50
): Promise<TutoringSession[]> => {
  const column = role === 'student' ? 'student_id' : 'tutor_id';

  const { data, error } = await supabase
    .from('tutoring_sessions')
    .select('*')
    .eq(column, userId)
    .order('scheduled_start', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch session history: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single session by ID
 */
export const getSession = async (sessionId: string): Promise<TutoringSession> => {
  const { data, error} = await supabase
    .from('tutoring_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  return data;
};

// =====================================================
// RESCHEDULING & CANCELLATION
// =====================================================

/**
 * Reschedule a session
 */
export const rescheduleSession = async (
  rescheduleData: RescheduleRequest
): Promise<TutoringSession> => {
  // Get original session
  const originalSession = await getSession(rescheduleData.session_id);

  // Calculate hours until session
  const hoursUntil =
    (new Date(originalSession.scheduled_start).getTime() - Date.now()) / (1000 * 60 * 60);

  // Check if rescheduling is allowed (at least 12 hours before)
  if (hoursUntil < 12) {
    throw new Error('Cannot reschedule within 12 hours of session start');
  }

  // Calculate new end time
  const newStart = new Date(rescheduleData.new_start_time);
  const newEnd = new Date(newStart.getTime() + originalSession.duration_minutes * 60 * 1000);

  // Update the session
  const { data, error } = await supabase
    .from('tutoring_sessions')
    .update({
      scheduled_start: newStart.toISOString(),
      scheduled_end: newEnd.toISOString(),
      rescheduled_from: originalSession.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rescheduleData.session_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reschedule session: ${error.message}`);
  }

  return data;
};

/**
 * Cancel a session
 */
export const cancelSession = async (
  sessionId: string,
  userId: string,
  cancellationData: CancellationRequest
): Promise<{ refund_amount: number; refund_percentage: number }> => {
  // Get session
  const session = await getSession(sessionId);

  // Calculate hours until session
  const hoursUntil =
    (new Date(session.scheduled_start).getTime() - Date.now()) / (1000 * 60 * 60);

  // Determine refund amount based on cancellation policy
  let refundPercentage = 0;
  if (hoursUntil >= 24) {
    refundPercentage = 100; // Full refund
  } else if (hoursUntil >= 12) {
    refundPercentage = 50; // Partial refund
  } else {
    refundPercentage = 0; // No refund
  }

  const refundAmount = (session.total_price * refundPercentage) / 100;

  // Update session status
  const { error } = await supabase
    .from('tutoring_sessions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: cancellationData.reason,
      payment_status: refundPercentage > 0 ? 'refunded' : session.payment_status,
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to cancel session: ${error.message}`);
  }

  return {
    refund_amount: refundAmount,
    refund_percentage: refundPercentage,
  };
};

// =====================================================
// REMINDER PREFERENCES
// =====================================================

/**
 * Get user's reminder preferences
 */
export const getReminderPreferences = async (userId: string): Promise<ReminderPreferences> => {
  const { data, error } = await supabase
    .from('reminder_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, return defaults
      return {
        id: '',
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        reminder_24h: true,
        reminder_2h: true,
        reminder_30m: true,
        dnd_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw new Error(`Failed to fetch reminder preferences: ${error.message}`);
  }

  return data;
};

/**
 * Update user's reminder preferences
 */
export const updateReminderPreferences = async (
  userId: string,
  preferences: Partial<ReminderPreferences>
): Promise<void> => {
  const { error } = await supabase
    .from('reminder_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to update reminder preferences: ${error.message}`);
  }
};

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get session statistics for a user
 */
export const getSessionStats = async (
  userId: string,
  role: 'student' | 'tutor'
): Promise<SessionStatsResponse> => {
  const column = role === 'student' ? 'student_id' : 'tutor_id';
  const now = new Date().toISOString();

  // Get total sessions
  const { count: totalCount } = await supabase
    .from('tutoring_sessions')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId);

  // Get upcoming sessions
  const { count: upcomingCount } = await supabase
    .from('tutoring_sessions')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)
    .gte('scheduled_start', now)
    .in('status', ['scheduled', 'confirmed']);

  // Get completed sessions
  const { count: completedCount } = await supabase
    .from('tutoring_sessions')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)
    .eq('status', 'completed');

  // Get no-show sessions
  const { count: noShowCount } = await supabase
    .from('tutoring_sessions')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)
    .eq('status', 'no_show');

  // Calculate no-show rate
  const noShowRate = totalCount && totalCount > 0 ? (noShowCount || 0) / totalCount : 0;

  // Get total revenue (for tutors)
  let totalRevenue = 0;
  if (role === 'tutor') {
    const { data: sessions } = await supabase
      .from('tutoring_sessions')
      .select('total_price')
      .eq('tutor_id', userId)
      .eq('status', 'completed')
      .eq('payment_status', 'paid');

    totalRevenue = sessions?.reduce((sum, s) => sum + parseFloat(s.total_price.toString()), 0) || 0;
  }

  return {
    total_sessions: totalCount || 0,
    upcoming_sessions: upcomingCount || 0,
    completed_sessions: completedCount || 0,
    no_show_rate: noShowRate,
    total_revenue: totalRevenue,
  };
};

/**
 * Get no-show history for a user
 */
export const getNoShowHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('no_show_history')
    .select('*')
    .eq('user_id', userId)
    .order('marked_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch no-show history: ${error.message}`);
  }

  return data || [];
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if a time slot is available
 */
export const isSlotAvailable = async (
  tutorId: string,
  start: Date,
  end: Date
): Promise<boolean> => {
  // Check for existing bookings
  const { data: existingBookings } = await supabase
    .from('tutoring_sessions')
    .select('id')
    .eq('tutor_id', tutorId)
    .in('status', ['scheduled', 'confirmed', 'in_progress'])
    .or(
      `and(scheduled_start.lte.${start.toISOString()},scheduled_end.gt.${start.toISOString()}),` +
        `and(scheduled_start.lt.${end.toISOString()},scheduled_end.gte.${end.toISOString()})`
    );

  // Check for blocked time
  const { data: blockedTime } = await supabase
    .from('tutor_time_blocks')
    .select('id')
    .eq('tutor_id', tutorId)
    .eq('block_type', 'blocked')
    .or(
      `and(start_datetime.lte.${start.toISOString()},end_datetime.gt.${start.toISOString()}),` +
        `and(start_datetime.lt.${end.toISOString()},end_datetime.gte.${end.toISOString()})`
    );

  return (!existingBookings || existingBookings.length === 0) &&
    (!blockedTime || blockedTime.length === 0);
};

/**
 * Format time for display
 */
export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format duration
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
};

/**
 * Calculate hours until session
 */
export const getHoursUntilSession = (sessionStart: string | Date): number => {
  return (new Date(sessionStart).getTime() - Date.now()) / (1000 * 60 * 60);
};

/**
 * Check if session can be cancelled with full refund
 */
export const canCancelWithFullRefund = (sessionStart: string | Date): boolean => {
  return getHoursUntilSession(sessionStart) >= 24;
};

/**
 * Check if session can be rescheduled
 */
export const canReschedule = (sessionStart: string | Date): boolean => {
  return getHoursUntilSession(sessionStart) >= 12;
};
