import { apiClient } from '@/lib/api';
import type { User, UserListResponse, UserUpdateData, ApiResponse } from '@/types';

export const userService = {
  // Get all users with pagination
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<UserListResponse>> => {
    return apiClient.get('/users', params);
  },

  // Get user by ID
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/${id}`);
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/email/${email}`);
  },

  // Update user
  updateUser: async (id: string, updates: UserUpdateData): Promise<ApiResponse<User>> => {
    return apiClient.put(`/users/${id}`, updates);
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/users/${id}`);
  },
};
