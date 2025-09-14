import { CalendarProvider, IntegrationStatus } from '@prisma/client';

// Calendar Integration DTOs
export interface GoogleOAuthInitDto {
  redirectUri?: string;
}

export interface GoogleOAuthCallbackDto {
  code: string;
  state: string;
}

export interface CalendarIntegrationDto {
  id: string;
  provider: CalendarProvider;
  status: IntegrationStatus;
  lastSyncAt: Date | null;
  createdAt: Date;
}

export interface CalendarDto {
  id: string;
  providerCalendarId: string;
  name: string;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncAt: Date | null;
}

export interface EventDto {
  id: string;
  providerEventId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location: string | null;
  meetingLink: string | null;
  attendeeCount: number | null;
  status: string;
  // 🔧 STORYLINE DATA: Include AI-generated story information
  storyline: StorylineDto | null; // ✅ Explicitly null when no storyline exists
}

export interface StorylineDto {
  id: string;
  theme: string;
  storyText: string;
  plainText: string;
  emoji: string | null;
  aiProvider: string | null;
  tokensUsed: number | null;
  isActive: boolean;
  hasStoryline: boolean; // Quick status check
  createdAt: Date;
  expiresAt: Date;
}

export interface SyncStatusDto {
  integrationId: string;
  status: 'success' | 'error' | 'in_progress';
  lastSyncAt: Date;
  eventsProcessed: number;
  error?: string;
}

// Google Calendar API Response Types
export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  items: GoogleCalendarItem[];
}

export interface GoogleCalendarItem {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone: string;
  primary?: boolean;
  accessRole: string;
}

export interface GoogleEventsResponse {
  kind: string;
  etag: string;
  summary: string;
  updated: string;
  timeZone: string;
  items: GoogleEventItem[];
}

export interface GoogleEventItem {
  kind: string;
  etag: string;
  id: string;
  status: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
  hangoutLink?: string;
  htmlLink?: string;
  updated: string;
  created: string;
}
