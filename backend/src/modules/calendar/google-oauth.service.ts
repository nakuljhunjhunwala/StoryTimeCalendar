import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';
import { env } from '@/shared/config/env.config';
import { prisma } from '@/database/db';
import { logger } from '@/shared/utils';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants';

// Removed unused interface

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class GoogleOAuthService {
  private static instance: GoogleOAuthService;
  private oauthStates = new Map<
    string,
    { userId: string; timestamp: number }
  >();

  public static getInstance(): GoogleOAuthService {
    if (!GoogleOAuthService.instance) {
      GoogleOAuthService.instance = new GoogleOAuthService();
    }
    return GoogleOAuthService.instance;
  }

  /**
   * Initialize Passport Google OAuth strategy
   */
  public initializePassport(): void {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/v1/calendar/auth/google/callback',
          scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
          ],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // This strategy is used for calendar integration, not user authentication
            // We'll handle the tokens in the callback route
            return done(null, { accessToken, refreshToken, profile });
          } catch (error) {
            logger.error('Google OAuth strategy error:', error);
            return done(error, false);
          }
        },
      ),
    );

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  public async generateAuthUrl(
    userId: string,
    redirectUri?: string,
  ): Promise<{ authUrl: string; state: string }> {
    try {
      // Generate secure state parameter
      const state = crypto.randomBytes(32).toString('hex');

      // Store state with user info (expires in 10 minutes)
      this.oauthStates.set(state, {
        userId,
        timestamp: Date.now() + 10 * 60 * 1000, // 10 minutes from now
      });

      // Clean up expired states
      this.cleanupExpiredStates();

      // Build OAuth URL
      const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri:
          redirectUri ||
          `${env.SERVER_URL}/api/v1/calendar/auth/google/callback`,
        response_type: 'code',
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
      });

      const authUrl = `${baseUrl}?${params.toString()}`;

      logger.info(`Generated Google OAuth URL for user: ${userId}`);
      return { authUrl, state };
    } catch (error) {
      logger.error('Failed to generate Google OAuth URL:', error);
      throw new ApiError(
        'Failed to generate authorization URL',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Handle OAuth callback and create calendar integration
   */
  public async handleCallback(
    code: string,
    state: string,
  ): Promise<{
    integrationId: string;
    calendarsFound: number;
  }> {
    try {
      // Verify state parameter
      const stateData = this.oauthStates.get(state);
      if (!stateData || stateData.timestamp < Date.now()) {
        throw new ApiError(
          'Invalid or expired OAuth state',
          StatusCodes.BAD_REQUEST,
        );
      }

      const { userId } = stateData;
      this.oauthStates.delete(state); // Clean up used state

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Encrypt tokens before storage
      const encryptedAccessToken = this.encryptToken(tokens.accessToken);
      const encryptedRefreshToken = this.encryptToken(tokens.refreshToken);

      // Create or update calendar integration
      const integration = await prisma.calendarIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider: 'GOOGLE',
          } as any,
        },
        create: {
          userId,
          provider: 'GOOGLE',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          status: 'ACTIVE',
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Google Calendar integration created/updated for user: ${userId}`,
      );

      // Fetch and store user's calendars
      const calendarsFound = await this.syncUserCalendars(integration.id);

      return {
        integrationId: integration.id,
        calendarsFound,
      };
    } catch (error) {
      logger.error('Google OAuth callback failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Failed to complete Google Calendar authorization',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${env.FRONTEND_URL}/api/v1/calendar/auth/google/callback`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Token exchange failed:', errorData);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to exchange code for tokens:', error);
      throw new ApiError(
        'Failed to exchange authorization code for tokens',
        StatusCodes.BAD_REQUEST,
      );
    }
  }

  /**
   * Sync user's calendars from Google
   */
  private async syncUserCalendars(integrationId: string): Promise<number> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Calendar integration not found');
      }

      const accessToken = this.decryptToken(integration.accessToken!);
      const calendars = await this.fetchGoogleCalendars(accessToken);

      let calendarsCreated = 0;
      for (const calendar of calendars) {
        await prisma.calendar.upsert({
          where: {
            integrationId_providerCalendarId: {
              integrationId: integration.id,
              providerCalendarId: calendar.id,
            },
          },
          create: {
            userId: integration.userId,
            integrationId: integration.id,
            providerCalendarId: calendar.id,
            name: calendar.summary,
            timezone: calendar.timeZone || 'UTC',
            isPrimary: calendar.primary || false,
            isActive: true,
          },
          update: {
            name: calendar.summary,
            timezone: calendar.timeZone || 'UTC',
            isPrimary: calendar.primary || false,
            updatedAt: new Date(),
          },
        });
        calendarsCreated++;
      }

      logger.info(
        `Synced ${calendarsCreated} calendars for integration: ${integrationId}`,
      );
      return calendarsCreated;
    } catch (error) {
      logger.error('Failed to sync user calendars:', error);
      throw error;
    }
  }

  /**
   * Fetch calendars from Google Calendar API
   */
  public async fetchGoogleCalendars(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          } as any,
        },
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      logger.error('Failed to fetch Google calendars:', error);
      throw error;
    }
  }

  /**
   * Encrypt token for secure storage
   */
  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt token from storage
   */
  private decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');

    const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Clean up expired OAuth states
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.oauthStates.entries()) {
      if (data.timestamp < now) {
        this.oauthStates.delete(state);
      }
    }
  }

  /**
   * Fetch Google Calendar events
   */
  public async fetchGoogleEvents(
    accessToken: string,
    calendarId: string,
  ): Promise<any[]> {
    try {
      const timeMin = new Date();
      // get event for past 7 days only not month
      timeMin.setDate(timeMin.getDate() - 7);

      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 1); // Get events up to 1 month ahead

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        } as any,
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items ?? [];
    } catch (error) {
      logger.error('Failed to fetch Google Calendar events:', error);
      throw error;
    }
  }

  /**
   * Refresh access token if needed
   */
  public async refreshTokenIfNeeded(integrationId: string): Promise<string> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Calendar integration not found');
      }

      // Check if token expires in the next 5 minutes
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes
      if (
        integration.tokenExpiry &&
        integration.tokenExpiry.getTime() > Date.now() + expiryBuffer
      ) {
        // Token is still valid
        return this.decryptToken(integration.accessToken!);
      }

      // Refresh the token
      const refreshToken = this.decryptToken(integration.refreshToken!);
      const newTokens = await this.refreshAccessToken(refreshToken);

      // Update integration with new tokens
      await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: {
          accessToken: this.encryptToken(newTokens.accessToken),
          tokenExpiry: new Date(Date.now() + newTokens.expiresIn * 1000),
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      logger.info(`Refreshed access token for integration: ${integrationId}`);
      return newTokens.accessToken;
    } catch (error) {
      logger.error('Failed to refresh access token:', error);

      // Mark integration as expired
      await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: { status: 'EXPIRED' },
      });

      throw new ApiError(
        'Calendar integration expired. Please reconnect your Google Calendar.',
        StatusCodes.UNAUTHORIZED,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }
}
