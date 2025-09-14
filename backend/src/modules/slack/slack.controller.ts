/**
 * Slack Controller - Handle Slack OAuth and API endpoints
 */

import { Request, Response } from 'express';
import { SlackService } from './slack.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import { logger } from '@/shared/utils/logger.util';
import { prisma } from '@/database/db';

export class SlackController {
  /**
   * Initiate Slack OAuth flow
   */
  static async initiateOAuth(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      // Generate state parameter for CSRF protection
      const state = `${user.userId}_${Date.now()}`;

      const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
      slackAuthUrl.searchParams.set('client_id', process.env.SLACK_CLIENT_ID!);
      slackAuthUrl.searchParams.set('scope', 'chat:write,users:read');
      slackAuthUrl.searchParams.set(
        'redirect_uri',
        process.env.SLACK_REDIRECT_URI ||
          'http://localhost:5004/api/v1/slack/oauth/callback',
      );
      slackAuthUrl.searchParams.set('state', state);

      logger.info('🚀 Initiating Slack OAuth flow', {
        userId: user.userId,
        state,
      });

      return ResponseUtil.success(
        res,
        {
          authUrl: slackAuthUrl.toString(),
          state,
        },
        'Slack OAuth URL generated',
      );
    } catch (error) {
      logger.error('❌ Slack OAuth initiation failed:', error);
      return ResponseUtil.error(res, 'Failed to initiate Slack OAuth', 500);
    }
  }

  /**
   * Handle Slack OAuth callback
   */
  static async handleOAuthCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        logger.warn('⚠️ Slack OAuth denied by user', { error });
        // Redirect to frontend with error
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=${encodeURIComponent(error as string)}`,
        );
      }

      if (!code || !state) {
        logger.error('❌ Missing code or state in OAuth callback');
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=missing_parameters`,
        );
      }

      // Extract userId from state parameter (format: userId_timestamp)
      const userId = (state as string).split('_')[0];
      if (!userId) {
        logger.error('❌ Invalid state parameter format');
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=invalid_state`,
        );
      }

      logger.info('🔄 Processing Slack OAuth callback', {
        userId,
        hasCode: !!code,
      });

      // Exchange code for tokens
      const oauthData = await SlackService.exchangeOAuthCode(code as string);

      // Store the integration
      await SlackService.storeSlackIntegration(userId, oauthData);

      logger.info('✅ Slack integration completed successfully', {
        userId,
        teamName: oauthData.team.name,
      });

      // Redirect to frontend with success
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?success=slack_connected&team=${encodeURIComponent(oauthData.team.name)}`,
      );
    } catch (error) {
      logger.error('❌ Slack OAuth callback failed:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=oauth_failed`,
      );
    }
  }

  /**
   * Get current Slack integration status
   */
  static async getIntegration(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const integration = await SlackService.getSlackIntegration(user.userId);

      if (!integration) {
        return ResponseUtil.success(
          res,
          { connected: false },
          'No Slack integration found',
        );
      }

      return ResponseUtil.success(
        res,
        {
          connected: true,
          integration: {
            teamName: integration.team_name,
            userId: integration.slack_user_id,
            connectedAt: integration.createdAt,
          },
        },
        'Slack integration retrieved',
      );
    } catch (error) {
      logger.error('❌ Failed to get Slack integration:', error);
      return ResponseUtil.error(res, 'Failed to get Slack integration', 500);
    }
  }

  /**
   * Test Slack message delivery
   */
  static async testMessage(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const testMessage = {
        text: '🎭 StoryTime Calendar Test Message',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "🎭 *StoryTime Calendar Test*\n\nYour Slack integration is working perfectly! You'll receive epic story reminders here 15 minutes before your events.",
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `✅ Sent at ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      };

      await SlackService.sendMessage(user.userId, testMessage);

      return ResponseUtil.success(res, null, 'Test message sent successfully');
    } catch (error) {
      logger.error('❌ Failed to send test message:', error);
      return ResponseUtil.error(res, 'Failed to send test message', 500);
    }
  }

  /**
   * Disconnect Slack integration
   */
  static async disconnect(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      await SlackService.disconnectSlack(user.userId);

      return ResponseUtil.success(res, null, 'Slack integration disconnected');
    } catch (error) {
      logger.error('❌ Failed to disconnect Slack:', error);
      return ResponseUtil.error(
        res,
        'Failed to disconnect Slack integration',
        500,
      );
    }
  }
}
