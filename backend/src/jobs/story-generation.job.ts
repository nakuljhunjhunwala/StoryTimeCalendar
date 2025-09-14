/**
 * Story Generation Background Job
 */

import { CronJob } from 'cron';
import { prisma } from '@/database/db';
import { StoryGenerationService } from '@/shared/services/story-generation.service';
import { APP_CONFIG } from '@/shared/constants/app.constants';

export class StoryGenerationJob {
  private static job: CronJob | null = null;

  /**
   * Start the story generation job
   * Runs every hour to generate storylines for upcoming events
   */
  static start(): void {
    // Run every hour at minute 15 (e.g., 8:15, 9:15, 10:15, etc.)
    this.job = new CronJob(
      '15 * * * *',
      this.generateStorylines,
      null,
      false,
      'UTC',
    );
    this.job.start();
    console.log('✅ Story generation job started - runs every hour at :15');
  }

  /**
   * Stop the story generation job
   */
  static stop(): void {
    if (this.job) {
      this.job.stop();
      console.log('❌ Story generation job stopped');
    }
  }

  /**
   * Main job function - generate storylines for all active users
   */
  private static async generateStorylines(): Promise<void> {
    const startTime = Date.now();
    console.log('🎭 Starting story generation job...');

    try {
      // Get all active users
      const activeUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          // Only process users who have AI settings configured OR use fallbacks
        },
      });

      console.log(`📊 Found ${activeUsers.length} active users to process`);

      let totalEventsProcessed = 0;
      let totalUsersProcessed = 0;
      let totalSuccessfulGenerations = 0;
      let totalFailedGenerations = 0;

      // Process users in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const userBatch = activeUsers.slice(i, i + batchSize);

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          userBatch.map((user) =>
            StoryGenerationJob.processUserStorylines(user.id),
          ),
        );

        // Aggregate results
        batchResults.forEach((result, index) => {
          totalUsersProcessed++;

          if (result.status === 'fulfilled') {
            totalEventsProcessed += result.value.totalEvents;
            totalSuccessfulGenerations += result.value.successfulGeneration;
            totalFailedGenerations += result.value.failedGeneration;
          } else {
            console.error(
              `Failed to process user ${userBatch[index].id}:`,
              result.reason,
            );
            // Count as failed for this user - we don't know event count here
            totalFailedGenerations += 1;
          }
        });

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < activeUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const duration = Date.now() - startTime;
      console.log('🎭 Story generation job completed:');
      console.log(`   📈 Users processed: ${totalUsersProcessed}`);
      console.log(`   📅 Events processed: ${totalEventsProcessed}`);
      console.log(
        `   ✅ Successful generations: ${totalSuccessfulGenerations}`,
      );
      console.log(`   ❌ Failed generations: ${totalFailedGenerations}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);

      // Log job completion to database for monitoring
      await StoryGenerationJob.logJobCompletion(
        totalUsersProcessed,
        totalEventsProcessed,
        totalSuccessfulGenerations,
        totalFailedGenerations,
        duration,
      );
    } catch (error) {
      console.error('❌ Story generation job failed:', error);

      // Log job failure
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await StoryGenerationJob.logJobFailure(errorMessage);
    }
  }

  /**
   * Process storylines for a single user
   */
  private static async processUserStorylines(userId: string): Promise<{
    totalEvents: number;
    successfulGeneration: number;
    failedGeneration: number;
  }> {
    try {
      const result = await StoryGenerationService.generateStorylinesForUser(
        userId,
        {
          forceRegenerate: false, // Only generate for events without valid storylines
          includeContext: true,
          maxRetries: 1, // Limited retries for background job
        },
      );

      console.log(
        `👤 User ${userId}: ${result.successfulGeneration}/${result.totalEvents} storylines generated`,
      );

      return result;
    } catch (error) {
      console.error(`Failed to process storylines for user ${userId}:`, error);

      // Return zero counts on error
      return {
        totalEvents: 0,
        successfulGeneration: 0,
        failedGeneration: 0,
      };
    }
  }

  /**
   * Log successful job completion
   */
  private static async logJobCompletion(
    usersProcessed: number,
    eventsProcessed: number,
    successfulGenerations: number,
    failedGenerations: number,
    durationMs: number,
  ): Promise<void> {
    try {
      await prisma.syncJob.create({
        data: {
          jobType: 'story_generation',
          status: 'completed',
          eventsProcessed: successfulGenerations,
          startedAt: new Date(Date.now() - durationMs),
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log job completion:', error);
    }
  }

  /**
   * Log job failure
   */
  private static async logJobFailure(errorMessage: string): Promise<void> {
    try {
      await prisma.syncJob.create({
        data: {
          jobType: 'story_generation',
          status: 'failed',
          eventsProcessed: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log job failure:', error);
    }
  }

  /**
   * Run job manually (for testing or immediate execution)
   */
  static async runManually(): Promise<void> {
    console.log('🔧 Running story generation job manually...');
    await this.generateStorylines();
  }

  /**
   * Get job status
   */
  static getStatus(): {
    isRunning: boolean;
    nextRun?: Date;
    lastRun?: Date;
  } {
    if (!this.job) {
      return { isRunning: false };
    }

    return {
      isRunning: (this.job as any).running || false,
      nextRun: this.job.nextDate()?.toJSDate(),
      lastRun: this.job.lastDate() || undefined,
    };
  }

  /**
   * Generate storylines for events needing immediate attention
   * (e.g., events starting in the next 2 hours without storylines)
   */
  static async generateUrgentStorylines(): Promise<void> {
    console.log('🚨 Generating urgent storylines...');

    try {
      // Find events starting in the next 2 hours without active storylines
      const urgentEvents = await prisma.event.findMany({
        where: {
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 2 * 60 * 60 * 1000), // Next 2 hours
          },
          status: 'ACTIVE',
        },
      });

      console.log(`⚡ Found ${urgentEvents.length} urgent events`);

      // Group by user to process efficiently
      const eventsByUser = urgentEvents.reduce(
        (acc, event) => {
          if (!acc[event.userId]) {
            acc[event.userId] = [];
          }
          acc[event.userId].push(event.id);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // Process each user's urgent events
      const results = await Promise.allSettled(
        Object.entries(eventsByUser).map(async ([userId, eventIds]) => {
          return StoryGenerationService.generateStorylinesForEvents(
            eventIds,
            userId,
            undefined, // Use user's default theme
            {
              forceRegenerate: false,
              includeContext: true,
              maxRetries: 2,
            },
          );
        }),
      );

      let totalProcessed = 0;
      let totalSuccessful = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          result.value.forEach((eventResult) => {
            totalProcessed++;
            if (eventResult.success) totalSuccessful++;
          });
        }
      });

      console.log(
        `⚡ Urgent storylines: ${totalSuccessful}/${totalProcessed} generated`,
      );
    } catch (error) {
      console.error('Failed to generate urgent storylines:', error);
    }
  }

  /**
   * Clean up old storylines that have expired
   */
  static async cleanupExpiredStorylines(): Promise<void> {
    try {
      const deletedCount =
        await StoryGenerationService.cleanupExpiredStorylines();
      console.log(`🧹 Cleaned up ${deletedCount} expired storylines`);
    } catch (error) {
      console.error('Failed to cleanup expired storylines:', error);
    }
  }
}
