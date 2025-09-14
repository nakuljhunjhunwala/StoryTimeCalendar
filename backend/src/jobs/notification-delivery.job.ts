/**
 * Notification Delivery Background Job
 * Processes due notifications every minute
 */

import { CronJob } from 'cron';
import { NotificationService } from '@/modules/notifications/notification.service';
import { logger } from '@/shared/utils/logger.util';

export class NotificationDeliveryJob {
  private static job: CronJob | null = null;

  /**
   * Start the notification delivery job
   * Runs every minute to check for due notifications
   */
  static start(): void {
    // Run every minute
    this.job = new CronJob(
      '* * * * *',
      NotificationDeliveryJob.processNotifications,
      null,
      false,
      'UTC',
    );
    this.job.start();
    console.log('✅ Notification delivery job started - runs every minute');
  }

  /**
   * Stop the notification delivery job
   */
  static stop(): void {
    if (this.job) {
      this.job.stop();
      console.log('❌ Notification delivery job stopped');
    }
  }

  /**
   * Main job function - process due notifications
   */
  private static async processNotifications(): Promise<void> {
    try {
      logger.debug('🔄 Processing due notifications...');
      await NotificationService.processDueNotifications();
    } catch (error) {
      logger.error('❌ Notification delivery job failed:', error);
    }
  }

  /**
   * Run job manually (for testing or immediate execution)
   */
  static async runManually(): Promise<void> {
    console.log('🔧 Running notification delivery job manually...');
    await NotificationDeliveryJob.processNotifications();
  }

  /**
   * Get job status
   */
  static getStatus() {
    if (!this.job) {
      return { status: 'NOT_RUNNING' };
    }

    return {
      status: 'RUNNING',
      isRunning: (this.job as any).running || false,
      nextRun: this.job.nextDate()?.toJSDate(),
      lastRun: this.job.lastDate() || undefined,
    };
  }
}
