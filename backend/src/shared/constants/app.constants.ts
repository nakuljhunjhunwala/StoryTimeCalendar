/**
 * StoryTime Calendar Application Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/user/profile',
    AI_SETTINGS: '/user/ai-settings',
    DASHBOARD: '/user/dashboard',
  },
  CALENDARS: {
    CONNECT: '/calendars/connect',
    LIST: '/calendars',
    SYNC: '/calendars/sync',
    DISCONNECT: '/calendars',
  },
  NOTIFICATIONS: {
    CHANNELS: '/notifications/channels',
    LOGS: '/notifications/logs',
  },
  EVENTS: {
    LIST: '/events',
    STORYLINES: '/events/:id/storylines',
    REGENERATE: '/events/:id/regenerate-story',
  },
  SYNC: {
    STATUS: '/sync/status',
    MANUAL: '/sync/manual',
  },
} as const;

// External AI API URLs
export const EXTERNAL_APIS = {
  GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  CLAUDE: 'https://api.anthropic.com/v1/messages',
  GOOGLE_CALENDAR: 'https://www.googleapis.com/calendar/v3',
  SLACK_API: 'https://slack.com/api',
} as const;

// App Configuration
export const APP_CONFIG = {
  JWT_EXPIRY_DAYS: 30,
  SYNC_WINDOW_DAYS: 2,
  RETRY_LIMITS: {
    NOTIFICATION: 3,
    SYNC: 3,
    AI_GENERATION: 2,
  },
  NOTIFICATION_MINUTES_BEFORE: 15,
  STORYLINE_CACHE_HOURS: 24,
  DAILY_SYNC_HOUR: 8, // 8 AM
} as const;

// Themes for story generation
export const THEMES = {
  FANTASY: 'FANTASY',
  GENZ: 'GENZ',
  MEME: 'MEME',
} as const;

// AI Providers
export const AI_PROVIDERS = {
  GEMINI: 'GEMINI',
  OPENAI: 'OPENAI',
  CLAUDE: 'CLAUDE',
  LLAMA: 'LLAMA',
} as const;

// Calendar Providers
export const CALENDAR_PROVIDERS = {
  GOOGLE: 'GOOGLE',
  MICROSOFT: 'MICROSOFT',
  OUTLOOK: 'OUTLOOK',
  APPLE: 'APPLE',
  CALDAV: 'CALDAV',
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
} as const;
