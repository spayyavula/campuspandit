/**
 * Session API Client
 * Handles all API calls for tutoring sessions and video conferencing
 */

import { supabase } from '../utils/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io';

export interface TutoringSession {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  actual_start?: string;
  actual_end?: string;

  // Video conferencing
  video_room_id?: string;
  video_room_url?: string;
  recording_enabled: boolean;
  recording_url?: string;
  recording_duration?: number;

  // Whiteboard
  whiteboard_enabled: boolean;
  whiteboard_data?: any;
  shared_files?: any[];

  // Session metrics
  connection_quality?: string;
  participant_join_times?: any;
  total_screen_share_duration?: number;

  // Pricing
  price_per_hour: number;
  total_price: number;
  payment_status: string;
  payment_transaction_id?: string;

  // Session materials
  student_notes?: string;
  tutor_notes?: string;
  homework_assigned?: string;
  files_uploaded?: any[];

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface VideoRoomJoinResponse {
  room_url: string;
  token: string;
  room_id: string;
  participant_name: string;
}

export interface CreateSessionRequest {
  student_id: string;
  tutor_id: string;
  subject: string;
  topic?: string;
  duration_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  timezone?: string;
  price_per_hour: number;
  total_price: number;
  recording_enabled?: boolean;
  whiteboard_enabled?: boolean;
}

class SessionAPI {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
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

  /**
   * Create a new tutoring session
   */
  async createSession(data: CreateSessionRequest): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all sessions for current user
   */
  async getSessions(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
  }): Promise<{ sessions: TutoringSession[]; total: number; page: number; page_size: number }> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);

    const query = queryParams.toString();
    return this.makeRequest<any>(`/sessions${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}`);
  }

  /**
   * Update a session
   */
  async updateSession(
    sessionId: string,
    data: Partial<TutoringSession>
  ): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Join a video room and get access token
   */
  async joinVideoRoom(sessionId: string): Promise<VideoRoomJoinResponse> {
    return this.makeRequest<VideoRoomJoinResponse>(`/sessions/${sessionId}/join`, {
      method: 'POST',
    });
  }

  /**
   * Update session status
   */
  async updateStatus(
    sessionId: string,
    status: string,
    data?: {
      actual_start?: string;
      actual_end?: string;
      cancellation_reason?: string;
    }
  ): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, ...data }),
    });
  }

  /**
   * Update recording information
   */
  async updateRecording(
    sessionId: string,
    data: {
      recording_id: string;
      recording_url: string;
      recording_duration?: number;
    }
  ): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}/recording`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update whiteboard data
   */
  async updateWhiteboard(
    sessionId: string,
    whiteboardData: any
  ): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}/whiteboard`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        whiteboard_data: whiteboardData,
      }),
    });
  }

  /**
   * Update session metrics
   */
  async updateMetrics(
    sessionId: string,
    metrics: {
      connection_quality?: string;
      participant_join_times?: any;
      total_screen_share_duration?: number;
    }
  ): Promise<TutoringSession> {
    return this.makeRequest<TutoringSession>(`/sessions/${sessionId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metrics),
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.makeRequest<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }
}

export const sessionAPI = new SessionAPI();
