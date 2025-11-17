/**
 * AI Tutor Matching Service - Frontend Integration
 *
 * This service provides functions to interact with the AI matching backend
 * Built for CampusPandit to find the best tutors for students
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with realtime COMPLETELY disabled
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  {
    realtime: {
      enabled: false
    }
  }
);

// Backend API URL (Python FastAPI)
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

// =====================================================
// Types
// =====================================================

export interface MatchingRequest {
  student_id: string;
  subject: string;
  grade_level?: string;
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  learning_pace?: 'slow' | 'moderate' | 'fast';
  goals?: string[];
  budget_max?: number;
  preferred_days?: string[];
  preferred_times?: ('morning' | 'afternoon' | 'evening')[];
  session_type?: 'one-time' | 'ongoing' | 'exam-prep';
  max_results?: number;
  include_ai_reasoning?: boolean;
}

export interface QuickMatchRequest {
  subject: string;
  budget_max?: number;
  max_results?: number;
}

export interface TutorMatchScore {
  subject_expertise: number;
  teaching_style: number;
  schedule_fit: number;
  budget_fit: number;
  experience_level: number;
  student_success: number;
  overall: number;
}

export interface TutorMatch {
  tutor_id: string;
  name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  subjects: string[];
  specializations: string[];
  years_experience: number;
  education_level?: string;
  avg_rating: number;
  total_reviews: number;
  student_success_rate: number;
  completion_rate: number;
  hourly_rate: number;
  weekly_availability_hours: number;
  response_time_minutes: number;
  match_score: TutorMatchScore;
  overall_match_percentage: number;
  ai_reasoning?: string;
  ai_confidence?: number;
  match_strengths: string[];
  match_considerations: string[];
  can_book_now: boolean;
  estimated_wait_time_hours?: number;
}

export interface MatchingResponse {
  matches: TutorMatch[];
  total_matches: number;
  ai_summary?: string;
  search_metadata: Record<string, any>;
  generated_at: string;
}

export interface TutorProfileCreate {
  bio: string;
  headline: string;
  years_experience: number;
  education_level: string;
  subjects: string[];
  specializations?: string[];
  grade_levels: string[];
  teaching_style: string;
  teaching_methods?: string[];
  languages?: string[];
  hourly_rate_min: number;
  hourly_rate_max: number;
  certifications?: any[];
  degrees?: any[];
}

export interface StudentProfileCreate {
  grade_level: string;
  learning_style: string;
  learning_pace: string;
  primary_goals: string[];
  target_subjects: string[];
  budget_per_hour?: number;
  preferred_session_length?: number;
  preferred_teaching_style?: string;
  timezone?: string;
}

export interface MatchFeedback {
  match_id: string;
  rating: number;
  feedback_text?: string;
  what_worked?: string[];
  what_didnt_work?: string[];
  would_recommend: boolean;
}

// =====================================================
// API Helper Functions
// =====================================================

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// =====================================================
// Matching Functions
// =====================================================

/**
 * Find matching tutors for a student using AI
 *
 * @example
 * ```typescript
 * const matches = await findMatchingTutors({
 *   student_id: userId,
 *   subject: 'Mathematics',
 *   grade_level: '10',
 *   learning_style: 'visual',
 *   goals: ['improve grades', 'prepare for exams'],
 *   budget_max: 60,
 *   preferred_times: ['afternoon', 'evening'],
 *   max_results: 5
 * });
 *
 * console.log('Top match:', matches.matches[0]);
 * console.log('AI Summary:', matches.ai_summary);
 * ```
 */
export async function findMatchingTutors(
  request: MatchingRequest
): Promise<MatchingResponse> {
  return apiRequest<MatchingResponse>('/matching/find-tutors', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Quick match without student profile (for anonymous users)
 *
 * @example
 * ```typescript
 * const matches = await quickMatch({
 *   subject: 'Physics',
 *   budget_max: 50,
 *   max_results: 3
 * });
 * ```
 */
export async function quickMatch(
  request: QuickMatchRequest
): Promise<MatchingResponse> {
  return apiRequest<MatchingResponse>('/matching/quick-match', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get matching history for a student
 *
 * @example
 * ```typescript
 * const history = await getMatchingHistory(userId, 20, 0);
 * console.log(`Total matches: ${history.length}`);
 * ```
 */
export async function getMatchingHistory(
  studentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  return apiRequest<any[]>(
    `/matching/history/${studentId}?limit=${limit}&offset=${offset}`
  );
}

/**
 * Submit feedback on a match
 *
 * @example
 * ```typescript
 * await submitMatchFeedback({
 *   match_id: matchId,
 *   rating: 5,
 *   feedback_text: 'Perfect match! Great teaching style.',
 *   what_worked: ['patient', 'explains well', 'flexible schedule'],
 *   would_recommend: true
 * });
 * ```
 */
export async function submitMatchFeedback(
  feedback: MatchFeedback
): Promise<{ status: string; message: string; match_id: string }> {
  return apiRequest('/matching/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

/**
 * Mark that student contacted a tutor
 */
export async function markTutorContacted(matchId: string): Promise<any> {
  return apiRequest(`/matching/mark-contacted/${matchId}`, {
    method: 'POST',
  });
}

/**
 * Mark that student booked a session with tutor
 */
export async function markSessionBooked(matchId: string): Promise<any> {
  return apiRequest(`/matching/mark-booked/${matchId}`, {
    method: 'POST',
  });
}

// =====================================================
// Profile Functions
// =====================================================

/**
 * Create or update tutor profile
 *
 * @example
 * ```typescript
 * const profile = await createTutorProfile(userId, {
 *   bio: 'Experienced math tutor with 5 years teaching calculus...',
 *   headline: 'Expert Math Tutor - Calculus Specialist',
 *   years_experience: 5,
 *   education_level: 'master',
 *   subjects: ['Mathematics', 'Statistics'],
 *   specializations: ['AP Calculus', 'SAT Math'],
 *   grade_levels: ['9-10', '11-12', 'college'],
 *   teaching_style: 'patient',
 *   hourly_rate_min: 40,
 *   hourly_rate_max: 60
 * });
 * ```
 */
export async function createTutorProfile(
  userId: string,
  profile: TutorProfileCreate
): Promise<any> {
  return apiRequest(`/matching/tutors/profile?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * Get tutor profile by ID
 */
export async function getTutorProfile(tutorId: string): Promise<any> {
  return apiRequest(`/matching/tutors/${tutorId}`);
}

/**
 * Get reviews for a tutor
 */
export async function getTutorReviews(
  tutorId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  return apiRequest(
    `/matching/tutors/${tutorId}/reviews?limit=${limit}&offset=${offset}`
  );
}

/**
 * List all tutors with filters
 *
 * @example
 * ```typescript
 * const tutors = await listTutors({
 *   subject: 'Mathematics',
 *   min_rating: 4.5,
 *   max_rate: 60,
 *   limit: 20
 * });
 * ```
 */
export async function listTutors(filters: {
  subject?: string;
  min_rating?: number;
  max_rate?: number;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  return apiRequest(`/matching/tutors?${params.toString()}`);
}

/**
 * Create or update student profile
 *
 * @example
 * ```typescript
 * const profile = await createStudentProfile(userId, {
 *   grade_level: '10',
 *   learning_style: 'visual',
 *   learning_pace: 'moderate',
 *   primary_goals: ['improve grades', 'prepare for SAT'],
 *   target_subjects: ['Mathematics', 'Physics'],
 *   budget_per_hour: 50,
 *   preferred_session_length: 60
 * });
 * ```
 */
export async function createStudentProfile(
  userId: string,
  profile: StudentProfileCreate
): Promise<any> {
  return apiRequest(`/matching/students/profile?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * Get student profile by ID
 */
export async function getStudentProfile(studentId: string): Promise<any> {
  return apiRequest(`/matching/students/${studentId}`);
}

// =====================================================
// Analytics Functions
// =====================================================

/**
 * Get matching system analytics
 *
 * @example
 * ```typescript
 * const analytics = await getMatchingAnalytics(30);  // Last 30 days
 * console.log(`Success rate: ${analytics.success_rate}%`);
 * console.log(`Avg match score: ${analytics.avg_match_score}`);
 * ```
 */
export async function getMatchingAnalytics(days: number = 30): Promise<any> {
  return apiRequest(`/matching/analytics?days=${days}`);
}

/**
 * Get top performing tutors
 *
 * @example
 * ```typescript
 * const topTutors = await getTopTutors(10, 'avg_rating');
 * ```
 */
export async function getTopTutors(
  limit: number = 10,
  metric: 'match_success' | 'avg_rating' | 'total_sessions' = 'match_success'
): Promise<any[]> {
  return apiRequest(`/matching/analytics/top-tutors?limit=${limit}&metric=${metric}`);
}

/**
 * Check matching service health
 */
export async function checkMatchingHealth(): Promise<{
  status: string;
  service: string;
  version: string;
  ai_provider: string;
}> {
  return apiRequest('/matching/health');
}
