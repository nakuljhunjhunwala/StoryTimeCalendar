// Export all services from a central location
export { authService } from './auth.service';
export { calendarService } from './calendar.service';
export { userService } from './user.service';
export { healthService } from './health.service';
export { aiService } from './ai.service';
export { slackService } from './slack.service';
export { notificationService } from './notification.service';

// Export service types
export type { AuthTokens, AuthResponse } from './auth.service';
export type {
    AIProvider,
    AIModels,
    APIKeyValidationResult,
    AITestResult,
    AIStats,
} from './ai.service';
export type { SlackIntegration, SlackOAuthResponse } from './slack.service';
export type {
    NotificationPreferences,
    NotificationStats,
    NotificationHistory,
} from './notification.service';
