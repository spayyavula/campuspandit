import { supabase } from './supabase';

/**
 * Tutoring System API
 * Comprehensive API for managing tutors, sessions, bookings, and reviews
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface TutorProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  country: string;
  timezone: string;
  languages: string[];
  qualifications?: any;
  teaching_experience_years: number;
  specialization: string[];
  subjects: string[];
  expertise_level?: string;
  verification_status?: string;
  hourly_rate_usd: number;
  currency?: string;
  availability?: any;
  accepts_instant_booking?: boolean;
  min_session_duration?: number;
  max_session_duration?: number;
  total_sessions?: number;
  total_hours_taught?: number;
  average_rating?: number;
  total_reviews?: number;
  is_active?: boolean;
  is_available?: boolean;
  video_intro_url?: string;
  teaching_style?: string;
  achievements?: string[];
  linkedin_url?: string;
  website_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TutoringSession {
  id?: string;
  tutor_id: string;
  student_id: string;
  subject: string;
  topic?: string;
  session_type?: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  timezone: string;
  session_notes?: string;
  student_notes?: string;
  meeting_platform?: string;
  meeting_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  status?: string;
  price_usd: number;
  payment_status?: string;
  payment_id?: string;
  created_at?: string;
}

export interface SessionReview {
  id?: string;
  session_id: string;
  tutor_id: string;
  student_id: string;
  rating: number;
  review_text?: string;
  subject_knowledge_rating?: number;
  teaching_style_rating?: number;
  communication_rating?: number;
  punctuality_rating?: number;
  helpful_tags?: string[];
  is_public?: boolean;
  created_at?: string;
}

export interface StudentBooking {
  id?: string;
  student_id: string;
  tutor_id: string;
  requested_subject: string;
  requested_topic?: string;
  requested_date: string;
  requested_time_slots?: any;
  special_requirements?: string;
  status?: string;
  response_message?: string;
  created_at?: string;
}

// =====================================================
// TUTOR MANAGEMENT API
// =====================================================

export const tutorAPI = {
  /**
   * Get all verified tutors with filters
   */
  async getTutors(filters?: {
    subjects?: string[];
    country?: string;
    min_rating?: number;
    max_rate?: number;
    specialization?: string[];
  }): Promise<TutorProfile[]> {
    try {
      let query = supabase
        .from('tutor_profiles')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .order('average_rating', { ascending: false });

      if (filters?.subjects && filters.subjects.length > 0) {
        query = query.overlaps('subjects', filters.subjects);
      }

      if (filters?.country) {
        query = query.eq('country', filters.country);
      }

      if (filters?.min_rating) {
        query = query.gte('average_rating', filters.min_rating);
      }

      if (filters?.max_rate) {
        query = query.lte('hourly_rate_usd', filters.max_rate);
      }

      if (filters?.specialization && filters.specialization.length > 0) {
        query = query.overlaps('specialization', filters.specialization);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
      return [];
    }
  },

  /**
   * Get tutor by ID
   */
  async getTutor(tutorId: string): Promise<TutorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', tutorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching tutor:', error);
      return null;
    }
  },

  /**
   * Create or update tutor profile
   */
  async upsertTutorProfile(profile: TutorProfile): Promise<{ success: boolean; data?: TutorProfile; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const profileData = {
        ...profile,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tutor_profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error upserting tutor profile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get tutor profile by user ID
   */
  async getTutorByUserId(userId: string): Promise<TutorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching tutor by user ID:', error);
      return null;
    }
  },

  /**
   * Update tutor availability
   */
  async updateAvailability(tutorId: string, isAvailable: boolean): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ is_available: isAvailable })
        .eq('id', tutorId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating availability:', error);
      return { success: false };
    }
  }
};

// =====================================================
// SESSION MANAGEMENT API
// =====================================================

export const sessionAPI = {
  /**
   * Create a new tutoring session
   */
  async createSession(session: TutoringSession): Promise<{ success: boolean; data?: TutoringSession; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tutoring_sessions')
        .insert({
          ...session,
          student_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get sessions for a user (student or tutor)
   */
  async getUserSessions(filters?: {
    status?: string;
    upcoming?: boolean;
  }): Promise<TutoringSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is a tutor
      const { data: tutorProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('tutoring_sessions')
        .select(`
          *,
          tutor:tutor_profiles(full_name, profile_image_url, average_rating)
        `);

      // Filter by user role
      if (tutorProfile) {
        query = query.eq('tutor_id', tutorProfile.id);
      } else {
        query = query.eq('student_id', user.id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.upcoming) {
        query = query.gte('scheduled_start', new Date().toISOString());
      }

      query = query.order('scheduled_start', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<TutoringSession | null> {
    try {
      const { data, error } = await supabase
        .from('tutoring_sessions')
        .select(`
          *,
          tutor:tutor_profiles(full_name, profile_image_url, average_rating, country, timezone)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching session:', error);
      return null;
    }
  },

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: string,
    additionalData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tutoring_sessions')
        .update({
          status,
          ...additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating session status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel session
   */
  async cancelSession(
    sessionId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tutoring_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling session:', error);
      return { success: false, error: error.message };
    }
  }
};

// =====================================================
// BOOKING MANAGEMENT API
// =====================================================

export const bookingAPI = {
  /**
   * Create a booking request
   */
  async createBooking(booking: StudentBooking): Promise<{ success: boolean; data?: StudentBooking; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('student_bookings')
        .insert({
          ...booking,
          student_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get bookings for current user
   */
  async getUserBookings(status?: string): Promise<StudentBooking[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('student_bookings')
        .select(`
          *,
          tutor:tutor_profiles(full_name, profile_image_url, subjects)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  /**
   * Respond to booking request (tutor)
   */
  async respondToBooking(
    bookingId: string,
    status: 'accepted' | 'rejected',
    responseMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('student_bookings')
        .update({
          status,
          response_message: responseMessage,
          responded_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error responding to booking:', error);
      return { success: false, error: error.message };
    }
  }
};

// =====================================================
// REVIEW MANAGEMENT API
// =====================================================

export const reviewAPI = {
  /**
   * Create a review for a session
   */
  async createReview(review: SessionReview): Promise<{ success: boolean; data?: SessionReview; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('session_reviews')
        .insert({
          ...review,
          student_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get reviews for a tutor
   */
  async getTutorReviews(tutorId: string, limit: number = 10): Promise<SessionReview[]> {
    try {
      const { data, error } = await supabase
        .from('session_reviews')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }
};

// =====================================================
// SUBJECT & SEARCH API
// =====================================================

export const subjectAPI = {
  /**
   * Get all subjects
   */
  async getSubjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  },

  /**
   * Search tutors by subject and other filters
   */
  async searchTutors(searchQuery: {
    subject?: string;
    specialization?: string[];
    country?: string;
    minRating?: number;
    maxRate?: number;
  }): Promise<TutorProfile[]> {
    try {
      let query = supabase
        .from('tutor_profiles')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('is_active', true);

      if (searchQuery.subject) {
        query = query.contains('subjects', [searchQuery.subject]);
      }

      if (searchQuery.specialization && searchQuery.specialization.length > 0) {
        query = query.overlaps('specialization', searchQuery.specialization);
      }

      if (searchQuery.country) {
        query = query.eq('country', searchQuery.country);
      }

      if (searchQuery.minRating) {
        query = query.gte('average_rating', searchQuery.minRating);
      }

      if (searchQuery.maxRate) {
        query = query.lte('hourly_rate_usd', searchQuery.maxRate);
      }

      query = query.order('average_rating', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error searching tutors:', error);
      return [];
    }
  }
};

// =====================================================
// FAVORITES API
// =====================================================

export const favoritesAPI = {
  /**
   * Add tutor to favorites
   */
  async addFavorite(tutorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('student_favorite_tutors')
        .insert({
          student_id: user.id,
          tutor_id: tutorId
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove tutor from favorites
   */
  async removeFavorite(tutorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('student_favorite_tutors')
        .delete()
        .eq('student_id', user.id)
        .eq('tutor_id', tutorId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's favorite tutors
   */
  async getFavorites(): Promise<TutorProfile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('student_favorite_tutors')
        .select(`
          tutor:tutor_profiles(*)
        `)
        .eq('student_id', user.id);

      if (error) throw error;
      return data?.map(item => item.tutor) || [];
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  },

  /**
   * Check if tutor is favorited
   */
  async isFavorite(tutorId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('student_favorite_tutors')
        .select('id')
        .eq('student_id', user.id)
        .eq('tutor_id', tutorId)
        .single();

      return !!data;
    } catch (error: any) {
      return false;
    }
  }
};

export default {
  tutorAPI,
  sessionAPI,
  bookingAPI,
  reviewAPI,
  subjectAPI,
  favoritesAPI
};
