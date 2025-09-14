import cron from 'node-cron';
import { logger } from '@/shared/utils/logger.util';

export const tokenCleanupJob = cron.schedule(
  '0 0 * * *', // Runs every day at midnight
  async () => {
    logger.info('Running expired token cleanup job...');
    try {
      // Note: In our StoryTime Calendar implementation, we use JWT-based refresh tokens
      // without a dedicated refresh_tokens table, so this cleanup is not needed.
      // This job can be used for other cleanup tasks in the future.
      logger.info(
        'Token cleanup completed (JWT-based tokens do not require database cleanup).',
      );
    } catch (error) {
      logger.error('Error during token cleanup job:', error);
    }
  },
  {
    timezone: 'UTC',
  },
);
