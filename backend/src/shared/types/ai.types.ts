/**
 * AI Provider Types and Interfaces
 */

import { AIProvider, Theme } from '@prisma/client';

// Response structure that all AI providers must return
export interface AIResponse {
  storyText: string;
  emoji: string;
  plainText: string;
  tokensUsed?: number;
  model?: string;
  provider: AIProvider;
}

// Standardized request structure for all AI providers
export interface AIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  apiKey: string;
}

// Expected JSON structure from AI providers
export interface AIStoryResponse {
  story_text: string;
  emoji: string;
  plain_text: string;
}

// Context for story generation
export interface StoryContext {
  eventTitle: string;
  eventDescription?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendeeCount?: number;
  meetingLink?: string;
  userAge?: number;
  userGender?: string;
  userTimezone: string;
  theme: Theme;
  previousStories?: PreviousStoryContext[];
}

// Previous story context for better continuity
export interface PreviousStoryContext {
  eventTitle: string;
  storyText: string;
  theme: Theme;
  eventDate: Date;
}

// AI Provider interface that all providers must implement
export interface IAIProvider {
  name: AIProvider;
  generateStory(request: AIRequest, context: StoryContext): Promise<AIResponse>;
  validateApiKey(apiKey: string): Promise<boolean>;
  getDefaultModel(): string;
  getSupportedModels(): string[];
  getMaxTokens(): number;
  getDefaultTemperature(): number;
}

// Error types for AI generation
export enum AIErrorType {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AIGenerationError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider: AIProvider,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

// Theme-specific prompt configuration
export interface ThemeConfig {
  theme: Theme;
  description: string;
  keywords: string[];
  emojis: string[];
  toneDescription: string;
  examples: {
    input: string;
    output: AIStoryResponse;
  }[];
}
