// API utility functions using environment configuration

import { config, buildApiUrl, debugLog } from '../config/env';

// API response types
interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

// Create a fetch wrapper with timeout and error handling
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = config.api.timeout
  } = config;

  const url = buildApiUrl(endpoint);
  
  debugLog('API Request:', { method, url, headers, body });

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetchWithTimeout(url, requestOptions, timeout);
    
    debugLog('API Response:', { status: response.status, url });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    const data = await response.json();
    return {
      data: data.data || data,
      success: true,
      message: data.message
    };
  } catch (error) {
    debugLog('API Error:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, 'TIMEOUT');
    }

    if (!navigator.onLine) {
      throw new ApiError('No internet connection', 0, 'OFFLINE');
    }

    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      'NETWORK_ERROR'
    );
  }
};

// Convenience methods for different HTTP methods
export const api = {
  get: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' })
};

// Specific API endpoints for the learning platform
export const learningApi = {
  // Course management
  getCourses: () => api.get('/courses'),
  getCourse: (id: string) => api.get(`/courses/${id}`),
  updateProgress: (courseId: string, lessonId: string, progress: any) =>
    api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, progress),

  // User progress
  getUserProgress: () => api.get('/user/progress'),
  syncProgress: (data: any) => api.post('/sync/progress', data),

  // Gaming features
  getTournaments: () => api.get('/tournaments'),
  joinTournament: (tournamentId: string) => api.post(`/tournaments/${tournamentId}/join`),
  submitQuizResult: (quizId: string, result: any) => api.post(`/quiz/${quizId}/result`, result),

  // Teams
  getTeams: () => api.get('/teams'),
  joinTeam: (teamId: string) => api.post(`/teams/${teamId}/join`),
  createTeam: (teamData: any) => api.post('/teams', teamData)
};

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'Request timed out. Please check your connection and try again.';
      case 'OFFLINE':
        return 'You appear to be offline. Please check your internet connection.';
      case 'NETWORK_ERROR':
        return 'Network error occurred. Please try again later.';
      default:
        return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

// Mock data helper for development
export const useMockData = (): boolean => {
  return config.development?.useMockData === true;
};

export default api;