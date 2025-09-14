import { tokenCleanupJob } from './token-cleanup.job';
import { calendarSyncJob } from './calendar-sync.job';
import { StoryGenerationJob } from './story-generation.job';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { logger } from '@/shared/utils';

export const startJobs = () => {
  tokenCleanupJob.start();
  calendarSyncJob.start();
  StoryGenerationJob.start();
  NotificationDeliveryJob.start();
  logger.info('🚀 Background jobs started successfully');
};
