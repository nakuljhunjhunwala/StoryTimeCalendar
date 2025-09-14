import cron from 'node-cron';
import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { CalendarService } from '@/modules/calendar/calendar.service';

export const calendarSyncJob = cron.schedule(
  '0 6 * * *', // Runs every day at 6:00 AM UTC
  async () => {
    logger.info('Starting daily calendar sync job for all users...');

    const calendarService = new CalendarService();
    let totalUsers = 0;
    let successfulSyncs = 0;
    let failedSyncs = 0;

    try {
      // Get all users - simplified for MVP
      const usersWithActiveIntegrations = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
        },
      });

      totalUsers = usersWithActiveIntegrations.length;
      logger.info(
        `Found ${totalUsers} users with active calendar integrations`,
      );

      if (totalUsers === 0) {
        logger.info(
          'No users with active calendar integrations found. Sync job completed.',
        );
        return;
      }

      // Process each user
      for (const user of usersWithActiveIntegrations) {
        try {
          logger.info(`Syncing calendars for user: ${user.email} (${user.id})`);

          // Sync events for this user
          const syncResult = await calendarService.syncUserEvents(user.id);

          logger.info(`✅ Successfully synced events for user: ${user.email}`, {
            syncResult,
          });
          successfulSyncs++;
        } catch (userSyncError) {
          logger.error(
            `❌ Failed to sync calendars for user: ${user.email} (${user.id})`,
            userSyncError,
          );
          failedSyncs++;
        }
      }

      // Log final summary
      logger.info(
        `📊 Daily calendar sync completed: ${successfulSyncs}/${totalUsers} users synced successfully, ${failedSyncs} failed`,
      );

      if (failedSyncs > 0) {
        logger.warn(
          `⚠️  ${failedSyncs} user(s) failed to sync. Check logs above for details.`,
        );
      }
    } catch (error) {
      logger.error('💥 Critical error during daily calendar sync job:', error);
    }
  },
  {
    timezone: 'UTC',
  },
);

// Utility function to manually trigger sync job (useful for testing)
export const triggerManualSync = async (): Promise<void> => {
  logger.info('🔧 Manual calendar sync triggered');

  const calendarService = new CalendarService();
  let totalUsers = 0;
  let successfulSyncs = 0;
  let failedSyncs = 0;

  try {
    // Get all users - simplified for MVP
    const usersWithActiveIntegrations = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    totalUsers = usersWithActiveIntegrations.length;
    logger.info(`Found ${totalUsers} users with active calendar integrations`);

    if (totalUsers === 0) {
      logger.info(
        'No users with active calendar integrations found. Manual sync completed.',
      );
      return;
    }

    // Process each user
    for (const user of usersWithActiveIntegrations) {
      try {
        logger.info(`Syncing calendars for user: ${user.email} (${user.id})`);

        // Sync events for this user
        const syncResult = await calendarService.syncUserEvents(user.id);

        logger.info(`✅ Successfully synced events for user: ${user.email}`, {
          syncResult,
        });
        successfulSyncs++;
      } catch (userSyncError) {
        logger.error(
          `❌ Failed to sync calendars for user: ${user.email} (${user.id})`,
          userSyncError,
        );
        failedSyncs++;
      }
    }

    // Log final summary
    logger.info(
      `📊 Manual calendar sync completed: ${successfulSyncs}/${totalUsers} users synced successfully, ${failedSyncs} failed`,
    );
  } catch (error) {
    logger.error('💥 Critical error during manual calendar sync:', error);
    throw error;
  }
};
