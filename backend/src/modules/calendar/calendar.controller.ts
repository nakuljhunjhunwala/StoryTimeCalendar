import { Response } from 'express';
import { asyncHandler, logger, ResponseUtil } from '@/shared/utils';
import { StatusCodes } from '@/shared/constants';
import { CalendarService } from './calendar.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOAuthCallbackDto, GoogleOAuthInitDto } from './calendar.dto';
import { triggerManualSync } from '@/jobs/calendar-sync.job';
import { env } from '@/shared/config/env.config';

export class CalendarController {
  private calendarService = new CalendarService();
  private googleOAuthService = GoogleOAuthService.getInstance();

  // Google OAuth endpoints
  initiateGoogleOAuth = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;
    const { redirectUri }: GoogleOAuthInitDto = req.body;

    // Use backend callback URL as the redirect URI for Google
    const backendCallbackUri = `${env.SERVER_URL}/api/v1/calendar/auth/google/callback`;

    const result = await this.googleOAuthService.generateAuthUrl(
      userId,
      backendCallbackUri,
    );

    ResponseUtil.success(
      res,
      result,
      'Google OAuth URL generated successfully',
    );
  });

  handleGoogleCallback = asyncHandler(async (req: any, res: Response) => {
    const { code, state, error } = req.query;

    try {
      // Handle OAuth errors from Google
      if (error) {
        const errorMessage =
          error === 'access_denied'
            ? 'Authorization was cancelled by user'
            : `OAuth error: ${error}`;

        // Redirect to frontend with error
        return res.redirect(
          `${env.CLIENT_URL}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`,
        );
      }

      // Validate required parameters
      if (!code || !state) {
        return res.redirect(
          `${env.CLIENT_URL}/auth/google/callback?error=${encodeURIComponent('Invalid authorization response')}`,
        );
      }

      // Process the callback
      const result = await this.googleOAuthService.handleCallback(
        code as string,
        state as string,
      );

      // Redirect to frontend with success
      const successUrl = new URL(`${env.CLIENT_URL}/auth/google/callback`);
      successUrl.searchParams.set('success', 'true');
      successUrl.searchParams.set('integrationId', result.integrationId);
      successUrl.searchParams.set(
        'calendarsFound',
        result.calendarsFound.toString(),
      );

      res.redirect(successUrl.toString());
    } catch (error: any) {
      logger.error('OAuth callback error:', error);
      const errorMessage = error.message || 'Failed to connect Google Calendar';
      res.redirect(
        `${env.CLIENT_URL}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  });

  // Integration management endpoints
  getIntegrations = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;

    const integrations = await this.calendarService.getUserIntegrations(userId);

    ResponseUtil.success(
      res,
      { integrations },
      'Calendar integrations retrieved successfully',
    );
  });

  getCalendars = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;

    const calendars = await this.calendarService.getUserCalendars(userId);

    ResponseUtil.success(
      res,
      { calendars },
      'Calendars retrieved successfully',
    );
  });

  updateCalendar = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { enabled } = req.body;
    const { userId } = req.user;

    const calendar = await this.calendarService.updateCalendar(
      id,
      userId,
      enabled,
    );

    ResponseUtil.success(res, { calendar }, 'Calendar updated successfully');
  });

  deleteIntegration = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user;

    // For now, we'll implement this as marking integration as INACTIVE
    const integration = await this.calendarService.updateIntegrationStatus(
      id,
      userId,
      'INACTIVE',
    );

    ResponseUtil.success(
      res,
      { integration },
      'Calendar integration disconnected successfully',
    );
  });

  // Event retrieval endpoint
  getEvents = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;
    const { limit = 10, from, to } = req.query;

    const events = await this.calendarService.getEvents(userId, {
      limit: parseInt(limit as string),
      from: from as string,
      to: to as string,
    });

    ResponseUtil.success(res, { events }, 'Events retrieved successfully');
  });

  // 🔧 STORYLINE GENERATION: Generate storyline for specific event
  generateStoryline = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;
    const { eventId } = req.params;
    const { theme, forceRegenerate = false } = req.body;

    const storyline = await this.calendarService.generateEventStoryline(
      eventId,
      userId,
      theme,
      forceRegenerate,
    );

    ResponseUtil.success(
      res,
      { storyline },
      'Storyline generated successfully',
    );
  });

  // Event synchronization endpoints
  syncEvents = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;
    const { fast } = req.query;

    // Use fast sync if requested
    const result =
      fast === 'true'
        ? await this.calendarService.syncUserEventsFast(userId)
        : await this.calendarService.syncUserEvents(userId);

    ResponseUtil.success(res, result, 'Calendar events synced successfully');
  });

  getSyncStatus = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user;

    const syncStatus = await this.calendarService.getSyncStatus(userId);

    ResponseUtil.success(res, syncStatus, 'Sync status retrieved successfully');
  });

  // Manual sync trigger for all users (Admin endpoint)
  triggerGlobalSync = asyncHandler(async (req: any, res: Response) => {
    try {
      // Trigger manual sync job
      await triggerManualSync();

      ResponseUtil.success(
        res,
        {},
        'Global calendar sync triggered successfully',
      );
    } catch {
      ResponseUtil.error(
        res,
        'Failed to trigger global sync',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  });
}
