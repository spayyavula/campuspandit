/**
 * AI Coaching API Client
 *
 * This replaces the Supabase-based coaching functions from coachingAI.ts
 * with backend API calls to our FastAPI endpoints.
 */

// Import types from existing coachingAI.ts
import type {
  WeakArea,
  CoachingSession,
  CoachingRecommendation,
  PerformanceAnalytics,
  RepetitionSchedule
} from '../utils/coachingAI';

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io';
const API_VERSION = '/api/v1';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token is invalid or expired
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/auth';

      throw new Error('Session expired. Please log in again.');
    }

    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

// =====================================================
// WEAK AREAS
// =====================================================

/**
 * Gets all weak areas for a student
 */
export async function getWeakAreas(studentId: string, status?: string): Promise<WeakArea[]> {
  try {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    const endpoint = `/coaching/weak-areas${params.toString() ? `?${params}` : ''}`;
    return await apiRequest<WeakArea[]>(endpoint);
  } catch (error) {
    console.error('Error fetching weak areas:', error);
    throw error;
  }
}

/**
 * Performs comprehensive weak area analysis
 * This will analyze flashcard performance, chapter progress, etc.
 */
export async function performComprehensiveWeakAreaAnalysis(studentId: string): Promise<WeakArea[]> {
  try {
    return await apiRequest<WeakArea[]>('/coaching/weak-areas/analyze', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error analyzing weak areas:', error);
    throw error;
  }
}

// =====================================================
// COACHING SESSIONS
// =====================================================

/**
 * Gets coaching sessions for a student
 */
export async function getCoachingSessions(studentId: string, limit: number = 10): Promise<CoachingSession[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return await apiRequest<CoachingSession[]>(`/coaching/sessions?${params}`);
  } catch (error) {
    console.error('Error fetching coaching sessions:', error);
    throw error;
  }
}

/**
 * Generates a daily coaching session with recommendations
 */
export async function generateDailyCoachingSession(studentId: string): Promise<CoachingSession> {
  try {
    return await apiRequest<CoachingSession>('/coaching/sessions/generate', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error generating coaching session:', error);
    throw error;
  }
}

/**
 * Marks coaching session as viewed
 */
export async function markCoachingSessionViewed(sessionId: string): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>(`/coaching/sessions/${sessionId}/viewed`, {
      method: 'PUT',
    });
  } catch (error) {
    console.error('Error marking session as viewed:', error);
    throw error;
  }
}

// =====================================================
// RECOMMENDATIONS
// =====================================================

/**
 * Gets recommendations for a student
 */
export async function getRecommendations(studentId: string, status?: string): Promise<CoachingRecommendation[]> {
  try {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    const endpoint = `/coaching/recommendations${params.toString() ? `?${params}` : ''}`;
    return await apiRequest<CoachingRecommendation[]>(endpoint);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

/**
 * Updates recommendation status
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  status: 'in_progress' | 'completed' | 'dismissed',
  completionPercentage?: number
): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>(`/coaching/recommendations/${recommendationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        completion_percentage: completionPercentage,
      }),
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    throw error;
  }
}

// =====================================================
// PERFORMANCE ANALYTICS
// =====================================================

/**
 * Gets latest performance analytics
 */
export async function getLatestAnalytics(studentId: string, periodType: string = 'weekly'): Promise<PerformanceAnalytics | null> {
  try {
    const params = new URLSearchParams({
      period_type: periodType,
    });

    return await apiRequest<PerformanceAnalytics | null>(`/coaching/analytics/latest?${params}`);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null; // Return null instead of throwing for empty data
  }
}

// =====================================================
// REPETITION SCHEDULE
// =====================================================

/**
 * Gets upcoming repetitions for a student
 */
export async function getUpcomingRepetitions(studentId: string, days: number = 7): Promise<RepetitionSchedule[]> {
  try {
    const params = new URLSearchParams({
      days: days.toString(),
    });

    return await apiRequest<RepetitionSchedule[]>(`/coaching/repetitions/upcoming?${params}`);
  } catch (error) {
    console.error('Error fetching upcoming repetitions:', error);
    throw error;
  }
}

// =====================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =====================================================

/**
 * Legacy function names for compatibility with existing components
 * These just call the new API-based functions
 */

export async function identifyWeakAreasFromFlashcards(studentId: string) {
  console.warn('identifyWeakAreasFromFlashcards is deprecated. Use performComprehensiveWeakAreaAnalysis instead.');
  return performComprehensiveWeakAreaAnalysis(studentId);
}

export async function identifyWeakAreasFromChapters(studentId: string) {
  console.warn('identifyWeakAreasFromChapters is deprecated. Use performComprehensiveWeakAreaAnalysis instead.');
  return performComprehensiveWeakAreaAnalysis(studentId);
}

export async function generateWeeklyAnalytics(studentId: string) {
  console.warn('generateWeeklyAnalytics is called, but backend does not yet support manual generation. Fetching latest instead.');
  return getLatestAnalytics(studentId, 'weekly');
}
