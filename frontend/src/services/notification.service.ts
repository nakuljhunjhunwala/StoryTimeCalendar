import { apiClient } from '@/lib/api';

export interface NotificationPreferences {
  reminderMinutes: number;
  enableNotifications: boolean;
  hasActiveChannels: boolean;
}

export interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
}

export interface NotificationHistory {
  id: string;
  status: string;
  scheduledFor: string;
  sentAt?: string;
  channel?: {
    type: string;
    name: string;
  };
  event?: {
    title: string;
    startTime: string;
    location?: string;
  };
  storyline?: {
    storyText: string;
    emoji: string;
    theme: string;
  };
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

class NotificationService {
  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get('/notifications/preferences');
      return response.data as NotificationPreferences;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        reminderMinutes: 15,
        enableNotifications: false,
        hasActiveChannels: false,
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: {
    reminderMinutes?: number;
    enableNotifications?: boolean;
  }): Promise<void> {
    try {
      await apiClient.put('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.get('/notifications/stats');
      return response.data as NotificationStats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0,
      };
    }
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(
    limit: number = 10
  ): Promise<{ notifications: NotificationHistory[] }> {
    try {
      const response = await apiClient.get(`/notifications/recent?limit=${limit}`);
      return response.data as { notifications: NotificationHistory[] };
    } catch (error) {
      console.error('Failed to get recent notifications:', error);
      return { notifications: [] };
    }
  }

  /**
   * Manually trigger notification for an event
   */
  async triggerNotification(eventId: string): Promise<void> {
    try {
      await apiClient.post(`/notifications/trigger/${eventId}`);
    } catch (error) {
      console.error('Failed to trigger notification:', error);
      throw new Error('Failed to trigger notification');
    }
  }
}

export const notificationService = new NotificationService();
