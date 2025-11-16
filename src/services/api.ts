/**
 * API Service for backend communication
 * Handles authentication and API calls to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
  logout(): void {
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

export { APIError };
export default authAPI;
