import { apiClient } from '@/lib/api';
import type { HealthStatus, DetailedHealthStatus, ApiResponse } from '@/types';

export const healthService = {
  // Basic health check
  getHealth: async (): Promise<ApiResponse<HealthStatus>> => {
    return apiClient.get('/health');
  },

  // Detailed health check with dependencies
  getDetailedHealth: async (): Promise<ApiResponse<DetailedHealthStatus>> => {
    return apiClient.get('/health/detailed');
  },
};
