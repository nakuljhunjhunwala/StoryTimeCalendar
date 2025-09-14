import { apiClient } from '@/lib/api';
import type {
  LoginCredentials,
  RegisterData,
  User,
  ApiResponse,
  UserProfileUpdate,
  AISettingsUpdate,
  ChangePasswordData,
} from '@/types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/register', data);
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/login', credentials);
  },

  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/me');
  },

  // Update user profile
  updateProfile: async (updates: UserProfileUpdate): Promise<ApiResponse<User>> => {
    return apiClient.put('/auth/profile', updates);
  },

  // Update AI settings
  updateAISettings: async (settings: AISettingsUpdate): Promise<ApiResponse<User>> => {
    return apiClient.put('/auth/ai-settings', settings);
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<void>> => {
    return apiClient.put('/auth/change-password', data);
  },

  // Logout user
  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/logout');
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  // Legacy methods (if needed for compatibility)
  getProfile: async (): Promise<ApiResponse<User>> => {
    return authService.getCurrentUser();
  },

  // Forgot password (placeholder - not implemented in backend yet)
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  // Reset password (placeholder - not implemented in backend yet)
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  // Verify email (placeholder - not implemented in backend yet)
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/verify-email', { token });
  },

  // Resend verification email (placeholder - not implemented in backend yet)
  resendVerification: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/resend-verification');
  },
};
