/**
 * Notification Service - Handle notification scheduling and delivery
 */

import { prisma } from '@/database/db';
import { SlackService } from '@/modules/slack/slack.service';
import { logger } from '@/shared/utils/logger.util';
import { NotificationStatus } from '@prisma/client';

export interface NotificationScheduleOptions {
  minutesBefore?: number;
  forceSchedule?: boolean;
}

export interface StorylineFormatted {
  storyText: string;
  emoji: string;
  plainText: string;
  theme: string;
}

export class NotificationService {
  /**
   * Schedule notification for an event
   */
  static async scheduleNotification(
    userId: string,
    eventId: string,
    storylineId: string,
    eventStartTime: Date,
    options: NotificationScheduleOptions = {},
  ): Promise<void> {
    try {
      const minutesBefore = options.minutesBefore || 15;
      const scheduledFor = new Date(
        eventStartTime.getTime() - minutesBefore * 60 * 1000,
      );

      // Don't schedule notifications for past events
      if (scheduledFor < new Date() && !options.forceSchedule) {
        logger.info('⏭️ Skipping notification for past event', {
          eventId,
          scheduledFor,
          eventStartTime,
        });
        return;
      }

      // Check if notification already exists
      const existingNotification = await prisma.notificationLog.findFirst({
        where: {
          userId,
          eventId,
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.SENT],
          },
        },
      });

      if (existingNotification) {
        logger.info('⚠️ Notification already scheduled for event', {
          eventId,
          notificationId: existingNotification.id,
          scheduledFor: existingNotification.scheduledFor,
        });
        return;
      }

      // Get the user's active notification channel
      const notificationChannel = await prisma.notificationChannel.findFirst({
        where: {
          userId,
          isActive: true,
          isPrimary: true,
        },
      });

      if (!notificationChannel) {
        logger.warn('⚠️ No active notification channel found for user', {
          userId,
        });
        return;
      }

      // Get storyline and event separately
      const storyline = await prisma.storyline.findUnique({
        where: { id: storylineId },
      });

      if (!storyline) {
        logger.error('❌ Storyline not found for notification', {
          storylineId,
        });
        return;
      }

      const event = await prisma.event.findUnique({
        where: { id: storyline.eventId },
        select: {
          title: true,
          startTime: true,
          location: true,
          attendeeCount: true,
        },
      });

      if (!event) {
        logger.error('❌ Event not found for notification', {
          eventId: storyline.eventId,
        });
        return;
      }

      // Create combined storyline object for message formatting
      const storylineWithEvent = { ...storyline, event };

      // Format the message text
      const messageText = await this.formatNotificationMessage(
        storylineWithEvent,
        notificationChannel.type,
      );

      // Create the notification log entry
      const notification = await prisma.notificationLog.create({
        data: {
          userId,
          eventId,
          storylineId,
          channelId: notificationChannel.id,
          scheduledFor,
          status: NotificationStatus.PENDING,
          messageText,
        },
      });

      logger.info('✅ Notification scheduled successfully', {
        notificationId: notification.id,
        eventId,
        scheduledFor,
        channelType: notificationChannel.type,
      });
    } catch (error) {
      logger.error('❌ Failed to schedule notification:', error);
      throw new Error('Failed to schedule notification');
    }
  }

  /**
   * Process due notifications (called by background job)
   */
  static async processDueNotifications(): Promise<void> {
    try {
      const currentTime = new Date();

      // Get notifications due for delivery
      const dueNotifications = await prisma.notificationLog.findMany({
        where: {
          status: NotificationStatus.PENDING,
          scheduledFor: {
            lte: currentTime,
          },
          retryCount: {
            lt: 3, // Maximum 3 retry attempts
          },
        },
        take: 50, // Process in batches
        orderBy: {
          scheduledFor: 'asc',
        },
      });

      if (dueNotifications.length === 0) {
        return;
      }

      logger.info(`📬 Processing ${dueNotifications.length} due notifications`);

      for (const notification of dueNotifications) {
        await this.deliverNotification(notification);

        // Small delay between deliveries to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      logger.error('❌ Failed to process due notifications:', error);
    }
  }

  /**
   * Deliver a single notification
   */
  private static async deliverNotification(notification: any): Promise<void> {
    try {
      // Fetch related data separately
      const channel = notification.channelId
        ? await prisma.notificationChannel.findUnique({
            where: { id: notification.channelId },
          })
        : null;

      const storyline = notification.storylineId
        ? await prisma.storyline.findUnique({
            where: { id: notification.storylineId },
          })
        : null;

      const event = storyline
        ? await prisma.event.findUnique({
            where: { id: storyline.eventId },
            select: {
              title: true,
              startTime: true,
              location: true,
              attendeeCount: true,
            },
          })
        : null;

      // Create enriched notification object
      const enrichedNotification = {
        ...notification,
        channel,
        storyline: storyline ? { ...storyline, event } : null,
      };

      logger.info('📤 Delivering notification', {
        notificationId: notification.id,
        channelType: channel?.type,
        eventTitle: event?.title,
      });

      let deliverySuccess = false;

      // Handle different channel types
      switch (enrichedNotification.channel?.type) {
        case 'slack':
          deliverySuccess =
            await this.deliverSlackNotification(enrichedNotification);
          break;
        default:
          logger.warn('⚠️ Unsupported notification channel type', {
            type: enrichedNotification.channel?.type,
            notificationId: notification.id,
          });
          deliverySuccess = false;
      }

      // Update notification status
      if (deliverySuccess) {
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            errorMessage: null,
          },
        });

        logger.info('✅ Notification delivered successfully', {
          notificationId: notification.id,
        });
      } else {
        await this.handleDeliveryFailure(notification);
      }
    } catch (error) {
      logger.error('❌ Failed to deliver notification:', error);
      await this.handleDeliveryFailure(notification, error);
    }
  }

  /**
   * Deliver notification via Slack
   */
  private static async deliverSlackNotification(
    notification: any,
  ): Promise<boolean> {
    try {
      const { storyline } = notification;
      const event = storyline?.event;

      if (!storyline || !event) {
        logger.error(
          '❌ Missing storyline or event data for Slack notification',
          {
            notificationId: notification.id,
          },
        );
        return false;
      }

      // Format the Slack message with rich blocks
      const slackMessage = {
        text: `🎭 ${event.title} reminder`, // Fallback text
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${storyline.emoji} *${storyline.storyText}*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📅 *${event.title}* • ${this.formatEventTime(event.startTime)}${event.location ? ` • 📍 ${event.location}` : ''}`,
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `🎭 StoryTime Calendar • Theme: ${storyline.theme}`,
              },
            ],
          },
        ],
      };

      // Send the message
      return await SlackService.sendMessage(notification.userId, slackMessage);
    } catch (error) {
      logger.error('❌ Failed to deliver Slack notification:', error);
      return false;
    }
  }

  /**
   * Handle delivery failure with retry logic
   */
  private static async handleDeliveryFailure(
    notification: any,
    error?: any,
  ): Promise<void> {
    try {
      const retryCount = notification.retryCount + 1;
      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        // Mark as permanently failed
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
            retryCount,
            errorMessage: error?.message || 'Max retries exceeded',
          },
        });

        logger.error('❌ Notification permanently failed', {
          notificationId: notification.id,
          retryCount,
          error: error?.message,
        });
      } else {
        // Schedule for retry with exponential backoff
        const retryDelayMinutes = Math.pow(2, retryCount - 1); // 1, 2, 4 minutes
        const nextRetryTime = new Date(
          Date.now() + retryDelayMinutes * 60 * 1000,
        );

        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            retryCount,
            scheduledFor: nextRetryTime,
            errorMessage: error?.message || 'Delivery failed',
          },
        });

        logger.warn('⚠️ Notification scheduled for retry', {
          notificationId: notification.id,
          retryCount,
          nextRetryTime,
          delayMinutes: retryDelayMinutes,
        });
      }
    } catch (updateError) {
      logger.error(
        '❌ Failed to update notification after delivery failure:',
        updateError,
      );
    }
  }

  /**
   * Format notification message text
   */
  private static async formatNotificationMessage(
    storyline: any,
    channelType: string,
  ): Promise<string> {
    const { event } = storyline;
    const eventTime = this.formatEventTime(event.startTime);

    switch (channelType) {
      case 'slack':
        return `${storyline.emoji} ${storyline.storyText}\n\n📅 ${event.title} • ${eventTime}${event.location ? ` • 📍 ${event.location}` : ''}`;
      default:
        return `${storyline.emoji} ${storyline.storyText}\n\n${event.title} at ${eventTime}`;
    }
  }

  /**
   * Format event time for display
   */
  private static formatEventTime(startTime: Date): string {
    return startTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Get notification statistics for user
   */
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
  }> {
    try {
      const stats = await prisma.notificationLog.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true,
        },
      });

      const result = {
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0,
      };

      for (const stat of stats) {
        result.total += stat._count.status;

        switch (stat.status) {
          case NotificationStatus.SENT:
            result.sent = stat._count.status;
            break;
          case NotificationStatus.PENDING:
            result.pending = stat._count.status;
            break;
          case NotificationStatus.FAILED:
            result.failed = stat._count.status;
            break;
        }
      }

      return result;
    } catch (error) {
      logger.error('❌ Failed to get notification stats:', error);
      return { total: 0, sent: 0, pending: 0, failed: 0 };
    }
  }

  /**
   * Cancel pending notifications for an event
   */
  static async cancelEventNotifications(eventId: string): Promise<void> {
    try {
      await prisma.notificationLog.updateMany({
        where: {
          eventId,
          status: NotificationStatus.PENDING,
        },
        data: {
          status: NotificationStatus.CANCELLED,
        },
      });

      logger.info('✅ Cancelled pending notifications for event', { eventId });
    } catch (error) {
      logger.error('❌ Failed to cancel event notifications:', error);
    }
  }
}
