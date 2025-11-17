/**
 * Course API Client
 * Handles all API calls for course platform
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io';

// ============================================================================
// TYPES
// ============================================================================

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  subtitle?: string;
  description: string;
  thumbnail_url?: string;
  promo_video_url?: string;
  category: string;
  subcategory?: string;
  board?: string;
  grade_level?: string;
  topics?: string[];
  level: string;
  language: string;
  duration_minutes?: number;
  total_lessons: number;
  total_quizzes: number;
  enrollment_count: number;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  is_free: boolean;
  price: number;
  discount_price?: number;
  discount_expires_at?: string;
  status: string;
  slug: string;
  certificate_enabled: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  description?: string;
  lesson_type: string;
  order: number;
  video_provider?: string;
  video_id?: string;
  video_url?: string;
  video_duration?: number;
  video_status?: string;
  video_qualities?: Record<string, string>;
  thumbnail_url?: string;
  subtitles?: Array<{ lang: string; url: string }>;
  is_preview: boolean;
  is_downloadable: boolean;
  requires_completion: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  student_id: string;
  watch_time_seconds: number;
  last_position_seconds: number;  // Resume from here!
  completion_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  times_watched: number;
  first_watched_at?: string;
  last_watched_at?: string;
  playback_speed: number;
  quality_selected?: string;
  notes?: string;
  bookmarks?: Array<{ time: number; note: string }>;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  lessons: (Lesson & { progress?: LessonProgress })[];
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  price_paid: number;
  progress_percentage: number;
  completed_lessons: number;
  total_watch_time_minutes: number;
  is_active: boolean;
  completed_at?: string;
  certificate_url?: string;
  last_accessed_at?: string;
}

export interface CourseDetail extends Course {
  sections: Section[];
  instructor_name?: string;
  is_enrolled: boolean;
  enrollment?: Enrollment;
}

// ============================================================================
// API CLIENT
// ============================================================================

class CourseAPI {
  private async getAuthToken(): Promise<string | null> {
    return localStorage.getItem('access_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // ========================================================================
  // COURSE ENDPOINTS
  // ========================================================================

  async getCourses(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    board?: string;
    grade_level?: string;
    level?: string;
    is_free?: boolean;
    search?: string;
    sort_by?: string;
  }): Promise<{ courses: Course[]; total: number; page: number; page_size: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const query = queryParams.toString();
    return this.makeRequest<any>(`/courses${query ? `?${query}` : ''}`);
  }

  async getCourse(courseId: string): Promise<CourseDetail> {
    return this.makeRequest<CourseDetail>(`/courses/${courseId}`);
  }

  async getMyCourses(): Promise<CourseDetail[]> {
    return this.makeRequest<CourseDetail[]>(`/courses/my-courses`);
  }

  // ========================================================================
  // ENROLLMENT ENDPOINTS
  // ========================================================================

  async enrollInCourse(courseId: string, paymentTransactionId?: string): Promise<Enrollment> {
    return this.makeRequest<Enrollment>(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        payment_transaction_id: paymentTransactionId,
      }),
    });
  }

  // ========================================================================
  // PROGRESS TRACKING ENDPOINTS
  // ========================================================================

  async updateProgress(
    lessonId: string,
    progress: {
      watch_time_seconds: number;
      last_position_seconds: number;
      completion_percentage: number;
      playback_speed?: number;
      quality_selected?: string;
    }
  ): Promise<LessonProgress> {
    return this.makeRequest<LessonProgress>(`/courses/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        ...progress,
      }),
    });
  }

  async getProgress(lessonId: string): Promise<LessonProgress | null> {
    try {
      return await this.makeRequest<LessonProgress>(`/courses/lessons/${lessonId}/progress`);
    } catch (error) {
      return null;
    }
  }

  // ========================================================================
  // VIDEO UPLOAD ENDPOINTS (for instructors)
  // ========================================================================

  async getUploadURL(
    lessonId: string,
    maxDurationSeconds: number = 7200
  ): Promise<{ upload_url: string; video_id: string; lesson_id: string }> {
    return this.makeRequest<any>(`/courses/lessons/${lessonId}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        max_duration_seconds: maxDurationSeconds,
      }),
    });
  }

  async updateVideoStatus(
    lessonId: string,
    videoId: string,
    status: string,
    duration?: number,
    thumbnailUrl?: string
  ): Promise<void> {
    await this.makeRequest<void>(`/courses/lessons/${lessonId}/video-status`, {
      method: 'POST',
      body: JSON.stringify({
        video_id: videoId,
        status,
        duration,
        thumbnail_url: thumbnailUrl,
      }),
    });
  }
}

export const courseAPI = new CourseAPI();
