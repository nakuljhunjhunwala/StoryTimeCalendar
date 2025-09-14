import passport from 'passport';
import { GoogleOAuthService } from '@/modules/calendar/google-oauth.service';
import { logger } from '@/shared/utils';

/**
 * Initialize Passport configuration for StoryTime Calendar
 */
export function initializePassport(): void {
  try {
    // Initialize Google OAuth service
    const googleOAuthService = GoogleOAuthService.getInstance();
    googleOAuthService.initializePassport();

    logger.info('Passport configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Passport configuration:', error);
    throw error;
  }
}

export { passport };
