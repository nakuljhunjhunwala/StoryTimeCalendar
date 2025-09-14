import { AIProvider, Gender, Theme } from '@prisma/client';

// Authentication DTOs for StoryTime Calendar
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  age?: number;
  gender?: Gender;
  selectedTheme?: Theme;
  timezone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    selectedTheme: Theme;
    aiProvider: AIProvider;
    isActive: boolean;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time (Unix timestamp)
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileDto {
  name?: string;
  age?: number;
  gender?: Gender;
  selectedTheme?: Theme;
  timezone?: string;
  notificationMinutes?: number;
}

export interface AISettingsDto {
  aiApiKey?: string;
  aiProvider?: AIProvider;
  aiModel?: string;
}
