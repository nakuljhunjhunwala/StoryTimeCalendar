/**
 * Notification Controller - Handle notification API endpoints
 */

import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import { logger } from '@/shared/utils/logger.util';
import { prisma } from '@/database/db';

export class NotificationController {
  /**
   * Get user's notification statistics
   */
  static async getStats(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const stats = await NotificationService.getNotificationStats(user.userId);

      return ResponseUtil.success(
        res,
        stats,
        'Notification statistics retrieved',
      );
    } catch (error) {
      logger.error('❌ Failed to get notification stats:', error);
      return ResponseUtil.error(
        res,
        'Failed to get notification statistics',
        500,
      );
    }
  }

  /**
   * Get user's recent notifications
   */
  static async getRecentNotifications(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { limit = 10 } = req.query;

      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const notifications = await prisma.notificationLog.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
      });

      // Fetch related data for all notifications
      const channelIds = [
        ...new Set(notifications.map((n) => n.channelId).filter(Boolean)),
      ];
      const storylineIds = [
        ...new Set(notifications.map((n) => n.storylineId).filter(Boolean)),
      ];
      const eventIds = [
        ...new Set(notifications.map((n) => n.eventId).filter(Boolean)),
      ];

      const [channels, storylines, events] = await Promise.all([
        channelIds.length > 0
          ? prisma.notificationChannel.findMany({
              where: { id: { in: channelIds as string[] } },
              select: { id: true, type: true, name: true },
            })
          : [],
        storylineIds.length > 0
          ? prisma.storyline.findMany({
              where: { id: { in: storylineIds as string[] } },
              select: { id: true, storyText: true, emoji: true, theme: true },
            })
          : [],
        eventIds.length > 0
          ? prisma.event.findMany({
              where: { id: { in: eventIds as string[] } },
              select: {
                id: true,
                title: true,
                startTime: true,
                location: true,
              },
            })
          : [],
      ]);

      // Create lookup maps
      const channelMap = new Map(channels.map((c) => [c.id, c]));
      const storylineMap = new Map(storylines.map((s) => [s.id, s]));
      const eventMap = new Map(events.map((e) => [e.id, e]));

      const formattedNotifications = notifications.map((notification) => ({
        id: notification.id,
        status: notification.status,
        scheduledFor: notification.scheduledFor,
        sentAt: notification.sentAt,
        channel: notification.channelId
          ? channelMap.get(notification.channelId)
          : null,
        event: notification.eventId ? eventMap.get(notification.eventId) : null,
        storyline: notification.storylineId
          ? storylineMap.get(notification.storylineId)
          : null,
        retryCount: notification.retryCount,
        errorMessage: notification.errorMessage,
        createdAt: notification.createdAt,
      }));

      return ResponseUtil.success(
        res,
        {
          notifications: formattedNotifications,
        },
        'Recent notifications retrieved',
      );
    } catch (error) {
      logger.error('❌ Failed to get recent notifications:', error);
      return ResponseUtil.error(res, 'Failed to get recent notifications', 500);
    }
  }

  /**
   * Manually trigger notification for an event
   */
  static async triggerNotification(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { eventId } = req.params;

      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      if (!eventId) {
        return ResponseUtil.error(res, 'Event ID is required', 400);
      }

      // Get the event
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId: user.userId,
        },
      });

      if (!event) {
        return ResponseUtil.error(res, 'Event not found', 404);
      }

      // Get the most recent active storyline for this event
      const storyline = await prisma.storyline.findFirst({
        where: {
          eventId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!storyline) {
        return ResponseUtil.error(
          res,
          'No active storyline found for event',
          404,
        );
      }

      // Schedule immediate notification (force schedule even if in past)
      await NotificationService.scheduleNotification(
        user.userId,
        eventId,
        storyline.id,
        event.startTime,
        { minutesBefore: 0, forceSchedule: true },
      );

      logger.info('✅ Manual notification triggered', {
        userId: user.userId,
        eventId,
        eventTitle: event.title,
      });

      return ResponseUtil.success(
        res,
        null,
        'Notification triggered successfully',
      );
    } catch (error) {
      logger.error('❌ Failed to trigger notification:', error);
      return ResponseUtil.error(res, 'Failed to trigger notification', 500);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { reminderMinutes, enableNotifications } = req.body;

      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      // Update user preferences
      const updateData: any = {};

      if (
        typeof reminderMinutes === 'number' &&
        reminderMinutes >= 0 &&
        reminderMinutes <= 60
      ) {
        updateData.notificationMinutes = reminderMinutes;
      }

      if (typeof enableNotifications === 'boolean') {
        // Update notification channel status
        await prisma.notificationChannel.updateMany({
          where: {
            userId: user.userId,
          },
          data: {
            isActive: enableNotifications,
          },
        });
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.userId },
          data: updateData,
        });
      }

      logger.info('✅ Notification preferences updated', {
        userId: user.userId,
        reminderMinutes,
        enableNotifications,
      });

      return ResponseUtil.success(
        res,
        {
          reminderMinutes: updateData.notificationMinutes,
          enableNotifications,
        },
        'Notification preferences updated',
      );
    } catch (error) {
      logger.error('❌ Failed to update notification preferences:', error);
      return ResponseUtil.error(
        res,
        'Failed to update notification preferences',
        500,
      );
    }
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(req: Request, res: Response) {
    try {
      const { user } = req as any;
      if (!user?.userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          notificationMinutes: true,
        },
      });

      const activeChannels = await prisma.notificationChannel.count({
        where: {
          userId: user.userId,
          isActive: true,
        },
      });

      return ResponseUtil.success(
        res,
        {
          reminderMinutes: userData?.notificationMinutes || 15,
          enableNotifications: activeChannels > 0,
          hasActiveChannels: activeChannels > 0,
        },
        'Notification preferences retrieved',
      );
    } catch (error) {
      logger.error('❌ Failed to get notification preferences:', error);
      return ResponseUtil.error(
        res,
        'Failed to get notification preferences',
        500,
      );
    }
  }
}
