/**
 * API Service - Backend Integration
 * Connects React Native app to FastAPI backend
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'  // Development
  : 'https://api.campuspandit.com/api/v1';  // Production

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh or logout
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function for GET requests
export const get = async <T>(url: string, params?: any): Promise<T> => {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
};

// Helper function for POST requests
export const post = async <T>(url: string, data?: any): Promise<T> => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};

// Helper function for PATCH requests
export const patch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
};

// Helper function for DELETE requests
export const del = async <T>(url: string): Promise<T> => {
  const response = await apiClient.delete<T>(url);
  return response.data;
};
