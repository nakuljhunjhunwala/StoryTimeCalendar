import { apiClient } from '@/lib/api';
import type {
  CalendarIntegration,
  Calendar,
  CalendarEvent,
  GoogleOAuthInit,
  GoogleOAuthInitResponse,
  SyncStatus,
  SyncStatusResponse,
  ManualSyncRequest,
  ApiResponse,
} from '@/types';

export const calendarService = {
  // Google OAuth Integration
  initiateGoogleOAuth: async (
    data?: GoogleOAuthInit
  ): Promise<ApiResponse<GoogleOAuthInitResponse>> => {
    return apiClient.post('/calendar/auth/google/init', data || {});
  },

  // Note: handleGoogleCallback is now handled by backend redirect
  // Frontend only needs to process URL parameters on callback page

  // Calendar Integrations
  getIntegrations: async (): Promise<ApiResponse<{ integrations: CalendarIntegration[] }>> => {
    return apiClient.get('/calendar/integrations');
  },

  deleteIntegration: async (integrationId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/calendar/integrations/${integrationId}`);
  },

  // Calendars
  getCalendars: async (): Promise<ApiResponse<Calendar[]>> => {
    return apiClient.get('/calendar/calendars');
  },

  updateCalendar: async (
    calendarId: string,
    updates: { isActive: boolean }
  ): Promise<ApiResponse<Calendar>> => {
    return apiClient.put(`/calendar/calendars/${calendarId}`, updates);
  },

  // Events
  getEvents: async (params?: {
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<ApiResponse<{ events: CalendarEvent[] }>> => {
    return apiClient.get('/calendar/events', params);
  },

  // Sync - Using optimized fast sync by default
  syncEvents: async (data?: ManualSyncRequest): Promise<ApiResponse<SyncStatus[]>> => {
    return apiClient.post('/calendar/sync?fast=true', data || {});
  },

  getSyncStatus: async (): Promise<ApiResponse<SyncStatusResponse>> => {
    return apiClient.get('/calendar/sync/status');
  },

  // Manual sync trigger (admin) - Note: Backend uses GET for this endpoint
  triggerGlobalSync: async (): Promise<ApiResponse<SyncStatusResponse>> => {
    return apiClient.get('/calendar/sync/status');
  },
};
