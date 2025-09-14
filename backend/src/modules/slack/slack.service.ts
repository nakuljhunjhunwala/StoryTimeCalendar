/**
 * Slack Service - Handle Slack OAuth and bot operations
 */

import { prisma } from '@/database/db';
import { EXTERNAL_APIS } from '@/shared/constants/app.constants';
import { decrypt, encrypt } from '@/shared/utils/encryption.util';
import { logger } from '@/shared/utils/logger.util';

export interface SlackOAuthTokens {
    access_token: string;
    team: {
        id: string;
        name: string;
    };
    authed_user: {
        id: string;
    };
    bot_user_id: string;
    scope: string;
    app_id: string;
}

export interface SlackMessage {
    text: string;
    blocks?: any[];
    unfurl_links?: boolean;
    unfurl_media?: boolean;
}

export class SlackService {
    /**
     * Exchange OAuth code for access token
     */
    static async exchangeOAuthCode(code: string): Promise<SlackOAuthTokens> {
        try {
            const response = await fetch('https://slack.com/api/oauth.v2.access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.SLACK_CLIENT_ID!,
                    client_secret: process.env.SLACK_CLIENT_SECRET!,
                    code,
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(`Slack OAuth error: ${data.error}`);
            }

            logger.info('✅ Slack OAuth exchange successful', {
                team: data.team?.name,
                botUserId: data.bot_user_id,
            });

            return data;
        } catch (error) {
            logger.error('❌ Slack OAuth exchange failed:', error);
            throw new Error('Failed to exchange Slack OAuth code');
        }
    }

    /**
     * Store Slack integration for user
     */
    static async storeSlackIntegration(
        userId: string,
        oauthData: SlackOAuthTokens,
    ): Promise<void> {
        try {
            // Encrypt the bot token
            const encryptedToken = encrypt(oauthData.access_token);

            // First, deactivate any existing Slack channels for this user
            await prisma.notificationChannel.updateMany({
                where: {
                    userId,
                    type: 'slack',
                },
                data: {
                    isActive: false,
                    isPrimary: false,
                },
            });

            // Store the new Slack DM configuration
            await prisma.notificationChannel.create({
                data: {
                    userId,
                    type: 'slack',
                    identifier: oauthData.authed_user.id, // Store Slack user ID for DMs
                    name: `${oauthData.team.name} - DM`,
                    isActive: true,
                    isPrimary: true,
                    metadata: {
                        team_id: oauthData.team.id,
                        team_name: oauthData.team.name,
                        bot_user_id: oauthData.bot_user_id,
                        slack_user_id: oauthData.authed_user.id,
                        access_token: encryptedToken,
                        app_id: oauthData.app_id,
                        scope: oauthData.scope,
                    },
                },
            });

            logger.info('✅ Slack integration stored successfully', {
                userId,
                team: oauthData.team.name,
                slackUserId: oauthData.authed_user.id,
            });
        } catch (error) {
            logger.error('❌ Failed to store Slack integration:', error);
            throw new Error('Failed to store Slack integration');
        }
    }

    /**
     * Send direct message to Slack user
     */
    static async sendMessage(
        userId: string,
        message: SlackMessage,
    ): Promise<boolean> {
        try {
            const slackIntegration = await prisma.notificationChannel.findFirst({
                where: {
                    userId,
                    type: 'slack',
                    isActive: true,
                },
            });

            if (
                !slackIntegration?.metadata ||
                typeof slackIntegration.metadata !== 'object'
            ) {
                throw new Error('No active Slack integration found');
            }

            const metadata = slackIntegration.metadata as any;
            const encryptedToken = metadata.access_token;
            const accessToken = decrypt(encryptedToken);
            const slackUserId = metadata.slack_user_id;

            // Send DM to the user directly using their Slack user ID
            const response = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...message,
                    channel: slackUserId, // Use user ID for DM
                    unfurl_links: false,
                    unfurl_media: false,
                }),
            });

            const data = await response.json();

            if (!data.ok) {
                logger.error('❌ Slack message delivery failed:', {
                    error: data.error,
                    slackUserId,
                    userId,
                });
                throw new Error(`Slack API error: ${data.error}`);
            }

            logger.info('✅ Slack DM delivered successfully', {
                slackUserId,
                userId,
                timestamp: data.ts,
            });

            return true;
        } catch (error) {
            logger.error('❌ Failed to send Slack message:', error);
            throw error;
        }
    }

    /**
     * Get channel info
     */
    private static async getChannelInfo(
        accessToken: string,
        channelId: string,
    ): Promise<{ name: string } | null> {
        try {
            const response = await fetch(
                `https://slack.com/api/conversations.info?channel=${channelId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            const data = await response.json();
            return data.ok ? data.channel : null;
        } catch (error) {
            logger.error('❌ Failed to get channel info:', error);
            return null;
        }
    }

    /**
     * Disconnect Slack integration
     */
    static async disconnectSlack(userId: string): Promise<void> {
        try {
            await prisma.notificationChannel.updateMany({
                where: {
                    userId,
                    type: 'slack',
                },
                data: {
                    isActive: false,
                },
            });

            logger.info('✅ Slack integration disconnected', { userId });
        } catch (error) {
            logger.error('❌ Failed to disconnect Slack:', error);
            throw new Error('Failed to disconnect Slack integration');
        }
    }

    /**
     * Get user's active Slack integration
     */
    static async getSlackIntegration(userId: string) {
        try {
            const integration = await prisma.notificationChannel.findFirst({
                where: {
                    userId,
                    type: 'slack',
                    isActive: true,
                },
            });

            if (!integration?.metadata || typeof integration.metadata !== 'object') {
                return null;
            }

            const metadata = integration.metadata as any;

            return {
                id: integration.id,
                name: integration.name,
                identifier: integration.identifier,
                team_name: metadata.team_name,
                slack_user_id: metadata.slack_user_id,
                isPrimary: integration.isPrimary,
                createdAt: integration.createdAt,
            };
        } catch (error) {
            logger.error('❌ Failed to get Slack integration:', error);
            return null;
        }
    }
}
