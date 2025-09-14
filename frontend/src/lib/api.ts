import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// Generic API methods
export const apiClient = {
  get: <T>(url: string, params?: unknown): Promise<ApiResponse<T>> =>
    api.get(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    api.post(url, data).then((res) => res.data),

  put: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    api.put(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    api.patch(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<ApiResponse<T>> => api.delete(url).then((res) => res.data),
};

export default api;
