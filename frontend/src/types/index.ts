// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  selectedTheme?: 'FANTASY' | 'GENZ' | 'MEME';
  timezone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  selectedTheme: 'FANTASY' | 'GENZ' | 'MEME';
  aiProvider: 'GEMINI' | 'OPENAI' | 'CLAUDE';
  isActive: boolean;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  timezone?: string;
  notificationMinutes?: number;
  hasApiKey?: boolean;
  apiKeyPreview?: string | null;
  aiModel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileUpdate {
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  selectedTheme?: 'FANTASY' | 'GENZ' | 'MEME';
  timezone?: string;
  notificationMinutes?: number;
}

export interface AISettingsUpdate {
  aiApiKey?: string;
  aiProvider?: 'GEMINI' | 'OPENAI' | 'CLAUDE';
  aiModel?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AISettings {
  tone: string;
  length: string;
  creativity: number;
  includeEmojis: boolean;
}

// Calendar Types
export interface CalendarIntegration {
  id: string;
  provider: 'GOOGLE' | 'MICROSOFT' | 'OUTLOOK' | 'APPLE' | 'CALDAV';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'EXPIRED';
  lastSyncAt: string | null;
  createdAt: string;
}

export interface Calendar {
  id: string;
  providerCalendarId: string;
  name: string;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncAt: string | null;
  color?: string;
}

export interface CalendarEvent {
  id: string;
  providerEventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string | null;
  meetingLink: string | null;
  attendeeCount: number | null;
  status: string;
  // 🔧 STORYLINE INTEGRATION: Add storyline data to event type
  storyline?: {
    id: string;
    theme: string;
    storyText: string;
    plainText: string;
    emoji: string | null;
    aiProvider: string | null;
    tokensUsed: number | null;
    isActive: boolean;
    hasStoryline: boolean;
    createdAt: string;
    expiresAt: string;
  };
}

export interface SyncStatus {
  integrationId: string;
  status: 'success' | 'error' | 'in_progress';
  lastSyncAt: string;
  eventsProcessed: number;
  error?: string;
}

export interface SyncStatusResponse {
  totalIntegrations: number;
  activeIntegrations: number;
  lastSyncAt: string | null;
  integrations: Array<{
    id: string;
    provider: string;
    status: string;
    lastSyncAt: string | null;
  }>;
}

export interface ManualSyncRequest {
  force?: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Google OAuth Types
export interface GoogleOAuthInit {
  redirectUri?: string;
}

export interface GoogleOAuthCallback {
  code: string;
  state: string;
}

export interface GoogleOAuthInitResponse {
  authUrl: string;
  state: string;
}

export interface GoogleCallbackResponse {
  integrationId: string;
  calendarsFound: number;
}

// User Management Types
export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserUpdateData {
  email?: string;
  profile_picture?: string;
  app_settings?: unknown;
}

// Health Check Types
export interface HealthStatus {
  status: 'UP' | 'DOWN';
}

export interface DetailedHealthStatus {
  status: 'UP' | 'DOWN';
  details: {
    database: {
      status: 'UP' | 'DOWN';
      error?: string;
    };
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType;
  disabled?: boolean;
  external?: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
