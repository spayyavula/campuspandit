/**
 * API Service for backend communication
 * Handles authentication and API calls to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'student' | 'tutor';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

export interface MessageResponse {
  message: string;
}

class APIError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));

      // Handle Pydantic validation errors (422 status with detail array)
      if (Array.isArray(error.detail)) {
        // Extract and format validation error messages
        const messages = error.detail.map((err: any) => {
          if (err.msg) {
            // Include field location if available
            const field = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          }
          return 'Validation error';
        });
        throw new APIError(response.status, messages.join(', '));
      }

      throw new APIError(response.status, error.detail || error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Network error');
  }
}

export const authAPI = {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<TokenResponse> {
    const response = await fetchAPI<TokenResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  /**
   * Log in an existing user
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await fetchAPI<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint (for logging purposes)
      await fetchAPI<MessageResponse>('/auth/logout', {
        method: 'POST',
      }).catch(() => {
        // Ignore errors - logout should work even if backend call fails
      });
    } finally {
      // Clear backend API auth
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Also clear Supabase auth (if present)
      localStorage.removeItem('campuspandit-auth-storage');

      // Clear any other auth-related items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  },

  /**
   * Get the current user from localStorage
   */
  getCurrentUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<MessageResponse> {
    return await fetchAPI<MessageResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<MessageResponse> {
    return await fetchAPI<MessageResponse>('/auth/password-reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<MessageResponse> {
    return await fetchAPI<MessageResponse>('/auth/password-reset-confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },
};

export const coursesAPI = {
  /**
   * Create a new course
   */
  async createCourse(data: any): Promise<any> {
    return await fetchAPI('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get instructor's courses
   */
  async getInstructorCourses(params?: { skip?: number; limit?: number; status_filter?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);

    const queryString = queryParams.toString();
    return await fetchAPI(`/instructor/my-courses${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<any> {
    return await fetchAPI(`/courses/${courseId}`);
  },

  /**
   * Update course
   */
  async updateCourse(courseId: string, data: any): Promise<any> {
    return await fetchAPI(`/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(courseId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/upload-thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new APIError(response.status, error.detail || 'Upload failed');
    }

    return await response.json();
  },

  /**
   * Get my enrolled courses
   */
  async getMyCourses(): Promise<any> {
    return await fetchAPI('/courses/my-courses');
  },

  /**
   * Get course statistics
   */
  async getCourseStatistics(courseId: string): Promise<any> {
    return await fetchAPI(`/courses/${courseId}/statistics`);
  },

  /**
   * Validate course before publishing
   */
  async validateCourse(courseId: string): Promise<any> {
    return await fetchAPI(`/courses/${courseId}/validate`);
  },

  /**
   * Publish course
   */
  async publishCourse(courseId: string): Promise<any> {
    return await fetchAPI(`/courses/${courseId}/publish`, {
      method: 'POST',
    });
  },

  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId: string): Promise<any> {
    return await fetchAPI(`/${courseId}/enroll`, {
      method: 'POST',
    });
  },

  /**
   * Get all courses (catalog)
   */
  async getAllCourses(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
    level?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.level) queryParams.append('level', params.level);

    const queryString = queryParams.toString();
    return await fetchAPI(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Create a new lesson under a course
   */
  async createLesson(courseId: string, data: any): Promise<any> {
    return await fetchAPI(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get lessons for a course
   */
  async getCourseLessons(courseId: string): Promise<any> {
    return await fetchAPI(`/courses/${courseId}/lessons`);
  },
};

// General purpose API client
const api = {
  async get<T = any>(endpoint: string): Promise<T> {
    return await fetchAPI<T>(endpoint, { method: 'GET' });
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return await fetchAPI<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return await fetchAPI<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return await fetchAPI<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    return await fetchAPI<T>(endpoint, { method: 'DELETE' });
  },
};

export { APIError };
export default api;
