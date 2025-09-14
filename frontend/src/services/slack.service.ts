import { apiClient } from '@/lib/api';

export interface SlackIntegration {
  connected: boolean;
  integration?: {
    teamName: string;
    userId: string;
    connectedAt: string;
  };
}

export interface SlackOAuthResponse {
  authUrl: string;
  state: string;
}

class SlackService {
  /**
   * Initiate Slack OAuth flow
   */
  async initiateOAuth(): Promise<SlackOAuthResponse> {
    try {
      const response = await apiClient.get('/slack/oauth/initiate');
      return response.data as SlackOAuthResponse;
    } catch (error) {
      console.error('Failed to initiate Slack OAuth:', error);
      throw new Error('Failed to start Slack connection process');
    }
  }

  /**
   * Handle OAuth callback (called by popup)
   */
  async handleOAuthCallback(code: string, state: string): Promise<void> {
    try {
      await apiClient.post('/slack/oauth/callback', {
        code,
        state,
      });
    } catch (error) {
      console.error('Failed to complete Slack OAuth:', error);
      throw new Error('Failed to complete Slack connection');
    }
  }

  /**
   * Get current Slack integration status
   */
  async getIntegration(): Promise<SlackIntegration> {
    try {
      const response = await apiClient.get('/slack/integration');
      return response.data as SlackIntegration;
    } catch (error) {
      console.error('Failed to get Slack integration:', error);
      return { connected: false };
    }
  }

  /**
   * Send test message
   */
  async sendTestMessage(): Promise<void> {
    try {
      await apiClient.post('/slack/test');
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw new Error('Failed to send test message');
    }
  }

  /**
   * Disconnect Slack integration
   */
  async disconnect(): Promise<void> {
    try {
      await apiClient.delete('/slack/disconnect');
    } catch (error) {
      console.error('Failed to disconnect Slack:', error);
      throw new Error('Failed to disconnect Slack integration');
    }
  }
}

export const slackService = new SlackService();
