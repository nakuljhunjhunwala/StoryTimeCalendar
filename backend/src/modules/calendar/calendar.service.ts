import { prisma } from '@/database/db';
import { logger } from '@/shared/utils';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants';
import crypto from 'crypto';
import {
  CalendarDto,
  CalendarIntegrationDto,
  EventDto,
  GoogleEventItem,
  SyncStatusDto,
} from './calendar.dto';
import { GoogleOAuthService } from './google-oauth.service';

export class CalendarService {
  private googleOAuthService = GoogleOAuthService.getInstance();

  /**
   * Get user's calendar integrations
   */
  public async getUserIntegrations(
    userId: string,
  ): Promise<CalendarIntegrationDto[]> {
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        createdAt: integration.createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get user integrations:', error);
      throw new ApiError(
        'Failed to retrieve calendar integrations',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new calendar integration
   */
  public async createIntegration(
    userId: string,
    provider: 'GOOGLE',
    providerData: any,
  ): Promise<CalendarIntegrationDto> {
    try {
      const integration = await prisma.calendarIntegration.create({
        data: {
          userId,
          provider,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          tokenExpiry: providerData.tokenExpiry,
          status: 'ACTIVE',
        },
      });

      logger.info(`Calendar integration created for user ${userId}`);

      return {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        createdAt: integration.createdAt,
      };
    } catch (error) {
      logger.error('Failed to create calendar integration:', error);
      throw new ApiError(
        'Failed to create calendar integration',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's calendars from all integrations
   */
  public async getUserCalendars(userId: string): Promise<CalendarDto[]> {
    try {
      const calendars = await prisma.calendar.findMany({
        where: { userId },
        orderBy: { isPrimary: 'desc' },
      });

      // For this MVP, we'll return basic calendar info
      // In production, we'd fetch integration details and provider info
      return calendars.map((calendar) => ({
        id: calendar.id,
        providerCalendarId: calendar.providerCalendarId,
        name: calendar.name,
        timezone: calendar.timezone,
        isPrimary: calendar.isPrimary,
        isActive: calendar.isActive,
        lastSyncAt: calendar.lastSyncAt,
      }));
    } catch (error) {
      logger.error('Failed to get user calendars:', error);
      throw new ApiError(
        'Failed to retrieve calendars',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update calendar settings
   */
  public async updateCalendar(
    calendarId: string,
    userId: string,
    isActive: boolean,
  ): Promise<CalendarDto> {
    try {
      const calendar = await prisma.calendar.findFirst({
        where: {
          id: calendarId,
          userId,
        },
      });

      if (!calendar) {
        throw new ApiError('Calendar not found', StatusCodes.NOT_FOUND);
      }

      const updatedCalendar = await prisma.calendar.update({
        where: { id: calendarId },
        data: { isActive },
      });

      return {
        id: updatedCalendar.id,
        providerCalendarId: updatedCalendar.providerCalendarId,
        name: updatedCalendar.name,
        timezone: updatedCalendar.timezone,
        isPrimary: updatedCalendar.isPrimary,
        isActive: updatedCalendar.isActive,
        lastSyncAt: updatedCalendar.lastSyncAt,
      };
    } catch (error) {
      logger.error('Failed to update calendar:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        'Failed to update calendar',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update integration status
   */
  public async updateIntegrationStatus(
    integrationId: string,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'EXPIRED',
  ) {
    try {
      const integration = await prisma.calendarIntegration.findFirst({
        where: {
          id: integrationId,
          userId,
        },
      });

      if (!integration) {
        throw new ApiError('Integration not found', StatusCodes.NOT_FOUND);
      }

      const updatedIntegration = await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: { status },
      });

      return {
        id: updatedIntegration.id,
        provider: updatedIntegration.provider,
        status: updatedIntegration.status,
        lastSyncAt: updatedIntegration.lastSyncAt,
        createdAt: updatedIntegration.createdAt,
      };
    } catch (error) {
      logger.error('Failed to update integration status:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        'Failed to update integration',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sync calendars for a specific integration
   */
  public async syncIntegrationCalendars(integrationId: string): Promise<void> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || integration.status !== 'ACTIVE') {
        throw new ApiError(
          'Integration not found or inactive',
          StatusCodes.NOT_FOUND,
        );
      }

      // Get properly decrypted and refreshed access token
      const accessToken =
        await this.googleOAuthService.refreshTokenIfNeeded(integrationId);

      const calendarsData =
        await this.googleOAuthService.fetchGoogleCalendars(accessToken);

      let calendarsCreated = 0;

      for (const calendarData of calendarsData ?? []) {
        await prisma.calendar.upsert({
          where: {
            integrationId_providerCalendarId: {
              integrationId: integration.id,
              providerCalendarId: calendarData.id,
            } as any,
          },
          update: {
            name: calendarData.summary ?? 'Unnamed Calendar',
            timezone: calendarData.timeZone ?? 'UTC',
            isPrimary: calendarData.primary ?? false,
          },
          create: {
            userId: integration.userId,
            integrationId: integration.id,
            providerCalendarId: calendarData.id,
            name: calendarData.summary ?? 'Unnamed Calendar',
            timezone: calendarData.timeZone ?? 'UTC',
            isPrimary: calendarData.primary ?? false,
            isActive: true,
          },
        });
        calendarsCreated++;
      }

      // Update integration last sync time
      await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      logger.info(
        `Synced ${calendarsCreated} calendars for integration ${integrationId}`,
      );
    } catch (error) {
      logger.error('Failed to sync integration calendars:', error);
      throw error;
    }
  }

  /**
   * Get user's events from all calendars
   */
  public async getEvents(
    userId: string,
    options: { limit?: number; from?: string; to?: string } = {},
  ): Promise<EventDto[]> {
    try {
      const { limit = 10, from, to } = options;

      // First get active calendars for the user
      const activeCalendars = await prisma.calendar.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: { id: true },
      });

      if (activeCalendars.length === 0) {
        return []; // No active calendars, return empty events
      }

      const calendarIds = activeCalendars.map((calendar) => calendar.id);

      // Build where clause for date filtering
      const whereClause: any = {
        userId,
        calendarId: {
          in: calendarIds,
        },
        status: 'ACTIVE', // Only active events
      };

      // If no date filters provided, default to showing events from today onwards
      if (from || to) {
        whereClause.startTime = {};
        if (from) whereClause.startTime.gte = new Date(from);
        if (to) whereClause.startTime.lte = new Date(to);
      } else {
        // Default: Show events from 7 days ago to future (prioritizing current/future)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        whereClause.startTime = {
          gte: weekAgo,
        };
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { startTime: 'asc' }, // Still chronological, but now starts from recent past
        take: limit,
      });

      // 🔧 STORYLINE INTEGRATION: Fetch storylines for events
      const eventIds = events.map((event) => event.id);
      const storylines = await this.getStorylinesForEvents(eventIds, userId);

      // Map storylines by eventId for quick lookup
      const storylineMap = new Map(storylines.map((s) => [s.eventId, s]));

      return events.map((event) => ({
        id: event.id,
        providerEventId: event.providerEventId,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        isAllDay: event.isAllDay,
        location: event.location,
        meetingLink: event.meetingLink,
        attendeeCount: event.attendeeCount,
        status: event.status,
        // Include storyline if available
        storyline: storylineMap.get(event.id)
          ? {
              id: storylineMap.get(event.id)!.id,
              theme: storylineMap.get(event.id)!.theme,
              storyText: storylineMap.get(event.id)!.storyText,
              plainText: storylineMap.get(event.id)!.plainText,
              emoji: storylineMap.get(event.id)!.emoji,
              aiProvider: storylineMap.get(event.id)!.aiProvider,
              tokensUsed: storylineMap.get(event.id)!.tokensUsed,
              isActive: storylineMap.get(event.id)!.isActive,
              hasStoryline: true,
              createdAt: storylineMap.get(event.id)!.createdAt,
              expiresAt: storylineMap.get(event.id)!.expiresAt,
            }
          : null, // 🔧 FIX: Return null instead of empty object for cleaner logic
      }));
    } catch (error) {
      logger.error('Failed to get user events:', error);
      throw new ApiError(
        'Failed to retrieve events',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔧 STORYLINE HELPER: Get storylines for a list of events
   */
  private async getStorylinesForEvents(
    eventIds: string[],
    userId: string,
  ): Promise<any[]> {
    if (eventIds.length === 0) return [];

    try {
      const storylines = await prisma.storyline.findMany({
        where: {
          eventId: { in: eventIds },
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }, // Only non-expired storylines
        },
        orderBy: { createdAt: 'desc' }, // Get latest storyline for each event
      });

      // Group by eventId and take the most recent for each event
      const storylineMap = new Map();
      storylines.forEach((storyline) => {
        if (!storylineMap.has(storyline.eventId)) {
          storylineMap.set(storyline.eventId, storyline);
        }
      });

      return Array.from(storylineMap.values());
    } catch (error) {
      logger.error('Failed to fetch storylines for events:', error);
      return []; // Return empty array on error, don't fail the whole request
    }
  }

  /**
   * 🔧 STORYLINE GENERATION: Generate storyline for specific event
   */
  public async generateEventStoryline(
    eventId: string,
    userId: string,
    theme?: string,
    forceRegenerate: boolean = false,
  ): Promise<any> {
    try {
      // First, verify the event exists and belongs to the user
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          userId,
          status: 'ACTIVE',
        },
      });

      if (!event) {
        throw new ApiError(
          'Event not found or access denied',
          StatusCodes.NOT_FOUND,
        );
      }

      // Get user's AI configuration
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          selectedTheme: true,
          aiProvider: true,
          aiApiKey: true,
          aiModel: true,
        },
      });

      if (!user) {
        throw new ApiError('User not found', StatusCodes.NOT_FOUND);
      }

      // Use provided theme or user's default
      const storyTheme = theme || user.selectedTheme;

      // Check if user has AI configured
      if (!user.aiApiKey || !user.aiProvider) {
        throw new ApiError(
          'AI configuration required. Please configure your AI settings first.',
          StatusCodes.BAD_REQUEST,
        );
      }

      // Import StoryGenerationService dynamically
      const { StoryGenerationService } = await import(
        '@/shared/services/story-generation.service'
      );

      // Generate storyline
      const result = await StoryGenerationService.generateStorylineForEvent(
        eventId,
        userId,
        storyTheme as any,
        { forceRegenerate },
      );

      if (!result.success) {
        throw new ApiError(
          result.error || 'Failed to generate storyline',
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        id: result.storyline!.id,
        theme: result.storyline!.theme,
        storyText: result.storyline!.storyText,
        plainText: result.storyline!.plainText,
        emoji: result.storyline!.emoji,
        aiProvider: result.storyline!.aiProvider,
        tokensUsed: result.storyline!.tokensUsed,
        isActive: result.storyline!.isActive,
        hasStoryline: true,
        createdAt: result.storyline!.createdAt,
        expiresAt: result.storyline!.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to generate storyline:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        'Failed to generate storyline',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get sync status for user's integrations
   */
  public async getSyncStatus(userId: string): Promise<{
    totalIntegrations: number;
    activeIntegrations: number;
    lastSyncAt: Date | null;
    integrations: Array<{
      id: string;
      provider: string;
      status: string;
      lastSyncAt: Date | null;
    }>;
  }> {
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const activeIntegrations = integrations.filter(
        (i) => i.status === 'ACTIVE',
      );
      const lastSyncAt = integrations.reduce(
        (latest, integration) => {
          if (
            integration.lastSyncAt &&
            (!latest || integration.lastSyncAt > latest)
          ) {
            return integration.lastSyncAt;
          }
          return latest;
        },
        null as Date | null,
      );

      return {
        totalIntegrations: integrations.length,
        activeIntegrations: activeIntegrations.length,
        lastSyncAt,
        integrations: integrations.map((integration) => ({
          id: integration.id,
          provider: integration.provider,
          status: integration.status,
          lastSyncAt: integration.lastSyncAt,
        })),
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw new ApiError(
        'Failed to retrieve sync status',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sync events for a specific user
   */
  public async syncUserEvents(userId: string): Promise<SyncStatusDto[]> {
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      if (integrations.length === 0) {
        logger.info(`No active integrations found for user ${userId}`);
        return [];
      }

      const results: SyncStatusDto[] = [];

      for (const integration of integrations) {
        try {
          // Refresh token if needed
          const refreshedAccessToken =
            await this.googleOAuthService.refreshTokenIfNeeded(integration.id);

          // Sync calendars first
          await this.syncIntegrationCalendars(integration.id);

          // Then sync events for each active calendar
          const userCalendars = await prisma.calendar.findMany({
            where: {
              integrationId: integration.id,
              isActive: true,
            },
          });

          let totalEventsProcessed = 0;

          for (const calendar of userCalendars) {
            const events = await this.googleOAuthService.fetchGoogleEvents(
              refreshedAccessToken,
              calendar.providerCalendarId,
            );

            totalEventsProcessed += await this.processEvents(
              calendar.id,
              events ?? [],
            );
          }

          // Update calendar last sync time
          await prisma.calendar.updateMany({
            where: { integrationId: integration.id },
            data: { lastSyncAt: new Date() },
          });

          results.push({
            integrationId: integration.id,
            status: 'success',
            lastSyncAt: new Date(),
            eventsProcessed: totalEventsProcessed,
          });

          logger.info(
            `Successfully synced ${totalEventsProcessed} events for integration ${integration.id}`,
          );
        } catch (error) {
          logger.error(
            `Failed to sync events for integration ${integration.id}:`,
            error,
          );

          results.push({
            integrationId: integration.id,
            status: 'error',
            lastSyncAt: new Date(),
            eventsProcessed: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to sync user events:', error);
      throw new ApiError(
        'Failed to sync calendar events',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process and store events from Google Calendar
   */
  private async processEvents(
    calendarId: string,
    events: GoogleEventItem[],
  ): Promise<number> {
    let processedCount = 0;

    for (const event of events) {
      try {
        // Calculate event hash for change detection
        const eventHash = this.calculateEventHash(event);

        // Check if event already exists
        const existingEvent = await prisma.event.findUnique({
          where: {
            calendarId_providerEventId: {
              calendarId,
              providerEventId: event.id,
            } as any,
          },
        });

        const eventData = {
          title: event.summary ?? 'Untitled Event',
          description: event.description ?? null,
          startTime: this.parseEventDateTime(event.start),
          endTime: this.parseEventDateTime(event.end),
          isAllDay: !event.start.dateTime, // All-day if no specific time
          location: event.location ?? null,
          meetingLink: this.extractMeetingLink(event),
          attendeeCount: event.attendees?.length ?? null,
          status: this.mapGoogleStatusToEventStatus(
            event.status ?? 'confirmed',
          ),
          dataHash: eventHash,
          lastUpdatedAt: new Date(),
        };

        if (existingEvent) {
          // Update if hash has changed (using dataHash field)
          if (existingEvent.dataHash !== eventHash) {
            await prisma.event.update({
              where: { id: existingEvent.id },
              data: eventData,
            });
            processedCount++;
          }
        } else {
          // Create new event
          const calendar = await prisma.calendar.findUnique({
            where: { id: calendarId },
            select: { userId: true },
          });

          if (calendar) {
            await prisma.event.create({
              data: {
                userId: calendar.userId,
                calendarId,
                providerEventId: event.id,
                ...eventData,
              },
            });
          }
          processedCount++;
        }
      } catch (error) {
        logger.error(`Failed to process event ${event.id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Calculate MD5 hash of event data for change detection
   */
  private calculateEventHash(event: GoogleEventItem): string {
    const hashData = JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      status: event.status,
      updated: event.updated,
    });

    return crypto.createHash('md5').update(hashData).digest('hex');
  }

  /**
   * Parse Google Calendar date/time format
   */
  private parseEventDateTime(dateTime: any): Date {
    if (dateTime.dateTime) {
      return new Date(dateTime.dateTime);
    } else if (dateTime.date) {
      return new Date(dateTime.date);
    }
    return new Date();
  }

  /**
   * Extract meeting link from event
   */
  private extractMeetingLink(event: any): string | undefined {
    return event.hangoutLink ?? event.htmlLink;
  }

  /**
   * Map Google Calendar status to EventStatus enum
   */
  private mapGoogleStatusToEventStatus(
    googleStatus: string,
  ): 'ACTIVE' | 'CANCELLED' | 'RESCHEDULED' {
    switch (googleStatus?.toLowerCase()) {
      case 'cancelled':
        return 'CANCELLED';
      case 'confirmed':
      case 'tentative':
      default:
        return 'ACTIVE';
    }
  }

  /**
   * FAST PARALLEL SYNC - Optimized version for testing
   */
  public async syncUserEventsFast(userId: string): Promise<SyncStatusDto[]> {
    const startTime = Date.now();
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId, status: 'ACTIVE' },
      });

      if (integrations.length === 0) {
        logger.info(`No active integrations found for user ${userId}`);
        return [];
      }

      logger.info(`🚀 FAST PARALLEL SYNC: ${integrations.length} integrations`);

      // Process all integrations in parallel
      const results = await Promise.allSettled(
        integrations.map(async (integration) => {
          const integrationStart = Date.now();
          try {
            const accessToken =
              await this.googleOAuthService.refreshTokenIfNeeded(
                integration.id,
              );
            await this.syncIntegrationCalendars(integration.id);

            const calendars = await prisma.calendar.findMany({
              where: { integrationId: integration.id, isActive: true },
            });

            if (calendars.length === 0) {
              return {
                integrationId: integration.id,
                status: 'success' as const,
                lastSyncAt: new Date(),
                eventsProcessed: 0,
              };
            }

            // Fetch events from all calendars in parallel
            const eventPromises = calendars.map(async (calendar) => {
              const events = await this.googleOAuthService.fetchGoogleEvents(
                accessToken,
                calendar.providerCalendarId,
              );
              return { calendarId: calendar.id, events: events ?? [] };
            });

            const calendarEvents = await Promise.all(eventPromises);

            // Process events in parallel batches
            const processingPromises = calendarEvents.map(
              ({ calendarId, events }) =>
                this.fastProcessEvents(calendarId, events, userId),
            );

            const eventCounts = await Promise.all(processingPromises);
            const totalEvents = eventCounts.reduce(
              (sum, count) => sum + count,
              0,
            );

            await prisma.calendar.updateMany({
              where: { integrationId: integration.id },
              data: { lastSyncAt: new Date() },
            });

            const time = Date.now() - integrationStart;
            logger.info(
              `✅ Integration ${integration.id}: ${totalEvents} events in ${time}ms`,
            );

            return {
              integrationId: integration.id,
              status: 'success' as const,
              lastSyncAt: new Date(),
              eventsProcessed: totalEvents,
            };
          } catch (error) {
            const time = Date.now() - integrationStart;
            logger.error(
              `❌ Integration ${integration.id} failed after ${time}ms:`,
              error,
            );
            return {
              integrationId: integration.id,
              status: 'error' as const,
              lastSyncAt: new Date(),
              eventsProcessed: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }),
      );

      const syncResults: SyncStatusDto[] = results.map((r) =>
        r.status === 'fulfilled' ? r.value : r.reason,
      );

      const totalTime = Date.now() - startTime;
      const totalEvents = syncResults.reduce(
        (sum, r) => sum + r.eventsProcessed,
        0,
      );
      logger.info(
        `🎯 FAST SYNC COMPLETE: ${totalEvents} events in ${totalTime}ms`,
      );

      return syncResults;
    } catch (error) {
      logger.error('Fast sync failed:', error);
      throw new ApiError(
        'Failed to sync calendar events',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * OPTIMIZED: Fast event processing with batch operations
   */
  private async fastProcessEvents(
    calendarId: string,
    events: GoogleEventItem[],
    userId: string,
  ): Promise<number> {
    if (events.length === 0) return 0;

    const start = Date.now();
    try {
      // Batch fetch existing events
      const existingEvents = await prisma.event.findMany({
        where: {
          calendarId,
          providerEventId: { in: events.map((e) => e.id) },
        },
        select: { id: true, providerEventId: true, dataHash: true },
      });

      const existingMap = new Map(
        existingEvents.map((e) => [e.providerEventId, e]),
      );
      const toCreate: any[] = [];
      const toUpdate: any[] = [];

      // Process in parallel
      events.forEach((event) => {
        try {
          const hash = this.calculateEventHash(event);
          const existing = existingMap.get(event.id);

          const data = {
            title: event.summary ?? 'Untitled Event',
            description: event.description ?? null,
            startTime: this.parseEventDateTime(event.start),
            endTime: this.parseEventDateTime(event.end),
            isAllDay: !event.start.dateTime,
            location: event.location ?? null,
            meetingLink: this.extractMeetingLink(event),
            attendeeCount: event.attendees?.length ?? null,
            status: this.mapGoogleStatusToEventStatus(
              event.status ?? 'confirmed',
            ),
            dataHash: hash,
            lastUpdatedAt: new Date(),
          };

          if (existing && existing.dataHash !== hash) {
            toUpdate.push({ where: { id: existing.id }, data });
          } else if (!existing) {
            toCreate.push({
              userId,
              calendarId,
              providerEventId: event.id,
              ...data,
            });
          }
        } catch (error) {
          logger.error(`Failed to process event ${event.id}:`, error);
        }
      });

      // Batch database operations
      const [createCount, updateCount] = await Promise.all([
        toCreate.length > 0
          ? prisma.event
              .createMany({ data: toCreate, skipDuplicates: true })
              .then((r) => r.count)
          : 0,
        toUpdate.length > 0
          ? Promise.all(
              toUpdate.map((u) => prisma.event.update(u).catch(() => null)),
            ).then((results) => results.filter((r) => r !== null).length)
          : 0,
      ]);

      const total = createCount + updateCount;
      const time = Date.now() - start;

      if (total > 0) {
        logger.info(
          `📦 Fast processed ${total} events (${createCount} new, ${updateCount} updated) in ${time}ms`,
        );
      }

      return total;
    } catch (error) {
      logger.error('Fast event processing failed:', error);
      return 0;
    }
  }
}
