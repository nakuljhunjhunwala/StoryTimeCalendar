/**
 * Story Generation Service - Main orchestration service
 */

import { AIProvider, Event, Storyline, Theme, User } from '@prisma/client';
import { prisma } from '@/database/db';
import { AIProviderFactory } from '@/shared/providers/ai/ai-provider.factory';
import { StoryPromptService } from './story-prompt.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import {
  AIErrorType,
  AIGenerationError,
  AIRequest,
  AIResponse,
  PreviousStoryContext,
  StoryContext,
} from '@/shared/types/ai.types';
import { APP_CONFIG } from '@/shared/constants/app.constants';
import { decrypt } from '../utils/encryption.util';

export interface StoryGenerationOptions {
  forceRegenerate?: boolean;
  includeContext?: boolean;
  maxRetries?: number;
}

export interface StoryGenerationResult {
  success: boolean;
  storyline?: Storyline;
  error?: string;
  errorType?: AIErrorType;
  fallbackUsed?: boolean;
  tokensUsed?: number;
}

export class StoryGenerationService {
  /**
   * Generate or retrieve storyline for an event
   */
  static async generateStorylineForEvent(
    eventId: string,
    userId: string,
    theme?: Theme,
    options: StoryGenerationOptions = {},
  ): Promise<StoryGenerationResult> {
    try {
      // Get event and user data
      const [event, user] = await Promise.all([
        prisma.event.findUnique({ where: { id: eventId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);

      if (!event) {
        return {
          success: false,
          error: 'Event not found',
          errorType: AIErrorType.INVALID_REQUEST,
        };
      }

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorType: AIErrorType.INVALID_REQUEST,
        };
      }

      const targetTheme = theme || user.selectedTheme;

      // 🔧 DUPLICATE PREVENTION: Check for existing valid storyline
      if (!options.forceRegenerate) {
        const existingStoryline = await this.getValidExistingStoryline(
          eventId,
          targetTheme,
        );
        if (existingStoryline) {
          console.log(
            '✅ Found existing storyline, avoiding duplicate generation:',
            {
              storylineId: existingStoryline.id,
              eventTitle: event.title,
              theme: targetTheme,
              createdAt: existingStoryline.createdAt,
              tokensUsed: existingStoryline.tokensUsed,
              provider: existingStoryline.aiProvider,
            },
          );
          return {
            success: true,
            storyline: existingStoryline,
            fallbackUsed: false,
            tokensUsed: 0, // No new tokens used since existing story was reused
          };
        }
      }

      // Generate new storyline
      return await this.createNewStoryline(event, user, targetTheme, options);
    } catch (error) {
      console.error('Story generation service error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
        errorType: AIErrorType.UNKNOWN_ERROR,
      };
    }
  }

  /**
   * Bulk generate storylines for multiple events
   */
  static async generateStorylinesForEvents(
    eventIds: string[],
    userId: string,
    theme?: Theme,
    options: StoryGenerationOptions = {},
  ): Promise<Array<StoryGenerationResult & { eventId: string }>> {
    const results = await Promise.allSettled(
      eventIds.map(async (eventId) => {
        const result = await this.generateStorylineForEvent(
          eventId,
          userId,
          theme,
          options,
        );
        return { ...result, eventId };
      }),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : 'Unknown error';
        return {
          eventId: eventIds[index],
          success: false,
          error: errorMessage,
          errorType: AIErrorType.UNKNOWN_ERROR,
        };
      }
    });
  }

  /**
   * Generate storylines for all upcoming events for a user
   */
  static async generateStorylinesForUser(
    userId: string,
    options: StoryGenerationOptions = {},
  ): Promise<{
    totalEvents: number;
    successfulGeneration: number;
    failedGeneration: number;
    results: Array<StoryGenerationResult & { eventId: string }>;
  }> {
    try {
      // Get user and upcoming events
      const [user, upcomingEvents] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.event.findMany({
          where: {
            userId,
            startTime: {
              gte: new Date(),
              lte: new Date(
                Date.now() + APP_CONFIG.SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000,
              ),
            },
            status: 'ACTIVE',
          },
          orderBy: { startTime: 'asc' },
        }),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate storylines for all events
      const results = await this.generateStorylinesForEvents(
        upcomingEvents.map((e) => e.id),
        userId,
        user.selectedTheme,
        options,
      );

      const successfulGeneration = results.filter((r) => r.success).length;
      const failedGeneration = results.filter((r) => !r.success).length;

      return {
        totalEvents: upcomingEvents.length,
        successfulGeneration,
        failedGeneration,
        results,
      };
    } catch (error) {
      console.error('Bulk story generation error:', error);
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  /**
   * Check if existing storyline is valid and not expired
   */
  private static async getValidExistingStoryline(
    eventId: string,
    theme: Theme,
  ): Promise<Storyline | null> {
    const storyline = await prisma.storyline.findUnique({
      where: {
        eventId_theme: {
          eventId,
          theme,
        },
      },
    });

    if (!storyline || !storyline.isActive || storyline.expiresAt < new Date()) {
      return null;
    }

    return storyline;
  }

  /**
   * Create new storyline with AI generation
   */
  private static async createNewStoryline(
    event: Event,
    user: User,
    theme: Theme,
    options: StoryGenerationOptions,
  ): Promise<StoryGenerationResult> {
    // Try AI generation first
    if (user.aiApiKey && user.aiProvider) {
      try {
        const aiResult = await this.generateWithAI(event, user, theme, options);
        if (aiResult.success) {
          return aiResult;
        }
        // Fall through to fallback if AI fails
        console.warn('AI generation failed, using fallback:', aiResult.error);
      } catch (error) {
        console.warn('AI generation error, using fallback:', error);
      }
    }

    // Use fallback generation
    return await this.generateFallbackStoryline(event, user.id, theme);
  }

  /**
   * Generate storyline using AI
   */
  private static async generateWithAI(
    event: Event,
    user: User,
    theme: Theme,
    options: StoryGenerationOptions,
  ): Promise<StoryGenerationResult> {
    try {
      // Get AI provider
      const provider = AIProviderFactory.getProvider(user.aiProvider);

      // Build story context
      const context = await this.buildStoryContext(
        event,
        user,
        theme,
        options.includeContext,
      );

      // Generate prompt
      const prompt = StoryPromptService.generatePrompt(context);

      // Create AI request
      console.log('🔑 Preparing AI request with encrypted API key...');
      console.log('📊 User AI data:', {
        userId: user.id,
        provider: user.aiProvider,
        model: user.aiModel,
        hasApiKey: !!user.aiApiKey,
        apiKeyLength: user.aiApiKey?.length || 0,
        apiKeyPreview: `${user.aiApiKey?.substring(0, 20)}...`,
      });

      let decryptedApiKey: string;
      try {
        console.log('🔓 Attempting to decrypt API key...');
        decryptedApiKey = decrypt(user.aiApiKey!);
        console.log(
          '✅ API key decrypted successfully, length:',
          decryptedApiKey.length,
        );
      } catch (decryptionError) {
        console.error('❌ API key decryption failed:', decryptionError);

        const errorMessage =
          decryptionError instanceof Error
            ? decryptionError.message
            : 'Unknown error';

        // Check for encryption key mismatch (most common issue)
        if (errorMessage.includes('ENCRYPTION_KEY_MISMATCH')) {
          console.log(
            '🔑 Detected encryption key mismatch - API key was encrypted with different key',
          );
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Your API key was encrypted with a different encryption key and cannot be decrypted. Please go to AI Settings and re-enter your API key.',
            user.aiProvider!,
            decryptionError instanceof Error ? decryptionError : undefined,
          );
        }

        // Check if the API key might be stored in plain text (legacy format)
        if (user.aiApiKey && !user.aiApiKey.includes(':')) {
          console.log(
            '🔄 Attempting to use API key as plain text (legacy format)...',
          );
          decryptedApiKey = user.aiApiKey;
          console.log(
            '⚠️ Using unencrypted API key - consider re-saving in AI settings for security',
          );
        } else {
          console.error(
            '💥 Complete API key failure - neither encrypted nor plain text format works',
          );
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Failed to decrypt API key. Please go to AI Settings and re-enter your API key to resolve this issue.',
            user.aiProvider!,
            decryptionError instanceof Error ? decryptionError : undefined,
          );
        }
      }

      // 🔧 UNIVERSAL FIX: Respect user's model choice
      const modelToUse = user.aiModel || provider.getDefaultModel();

      console.log('🤖 Using AI model:', {
        requestedModel: user.aiModel,
        defaultModel: provider.getDefaultModel(),
        finalModel: modelToUse,
        provider: user.aiProvider,
      });

      const aiRequest: AIRequest = {
        prompt,
        apiKey: decryptedApiKey,
        model: modelToUse,
        maxTokens: 300, // Increased for better story quality
        temperature: 0.8, // Increased for more creativity
      };

      // Generate story with retries
      const maxRetries =
        options.maxRetries || APP_CONFIG.RETRY_LIMITS.AI_GENERATION;
      let lastError: AIGenerationError | null = null;

      console.log(
        `🎭 Starting AI story generation with ${maxRetries} max retries...`,
      );
      console.log('📝 Prompt preview:', `${prompt.substring(0, 200)}...`);

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`🎲 Generation attempt ${attempt + 1}/${maxRetries}`);
          const startTime = Date.now();

          const aiResponse = await provider.generateStory(aiRequest, context);

          const duration = Date.now() - startTime;
          console.log(`✅ AI generation successful in ${duration}ms`);
          console.log('📊 AI Response:', {
            tokensUsed: aiResponse.tokensUsed,
            hasStory: !!aiResponse.storyText,
            storyLength: aiResponse.storyText?.length || 0,
            hasEmoji: !!aiResponse.emoji,
            provider: user.aiProvider,
          });

          // Create storyline in database
          const storyline = await this.saveStoryline(
            event,
            user.id,
            theme,
            aiResponse,
            false,
          );

          console.log(
            `💾 Storyline saved successfully with ID: ${storyline.id}`,
          );

          // Schedule notification for this event
          try {
            await NotificationService.scheduleNotification(
              user.id,
              event.id,
              storyline.id,
              event.startTime,
              { minutesBefore: user.notificationMinutes || 15 },
            );
            console.log(`📬 Notification scheduled for event: ${event.title}`);
          } catch (notificationError) {
            console.warn(
              '⚠️ Failed to schedule notification:',
              notificationError,
            );
            // Don't fail the entire story generation if notification scheduling fails
          }

          return {
            success: true,
            storyline,
            tokensUsed: aiResponse.tokensUsed,
            fallbackUsed: false,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          lastError =
            error instanceof AIGenerationError
              ? error
              : new AIGenerationError(
                  AIErrorType.UNKNOWN_ERROR,
                  errorMessage,
                  user.aiProvider,
                  error instanceof Error ? error : undefined,
                );

          console.error(
            `❌ AI generation attempt ${attempt + 1}/${maxRetries} failed:`,
            {
              error: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
              provider: user.aiProvider,
              model: user.aiModel,
              eventTitle: context.eventTitle,
              attempt: attempt + 1,
            },
          );

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000),
            );
          }
        }
      }

      // All retries failed
      return {
        success: false,
        error: lastError?.message || 'AI generation failed after retries',
        errorType: lastError?.type || AIErrorType.UNKNOWN_ERROR,
      };
    } catch (error) {
      console.error('AI generation setup error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'AI generation setup failed';
      return {
        success: false,
        error: errorMessage,
        errorType: AIErrorType.UNKNOWN_ERROR,
      };
    }
  }

  /**
   * Generate fallback storyline when AI is not available
   */
  private static async generateFallbackStoryline(
    event: Event,
    userId: string,
    theme: Theme,
  ): Promise<StoryGenerationResult> {
    try {
      const fallbackResponse = this.createFallbackResponse(event, theme);
      const storyline = await this.saveStoryline(
        event,
        userId,
        theme,
        fallbackResponse,
        true,
      );

      // Schedule notification for fallback storyline too
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          await NotificationService.scheduleNotification(
            userId,
            event.id,
            storyline.id,
            event.startTime,
            { minutesBefore: user.notificationMinutes || 15 },
          );
          console.log(
            `📬 Notification scheduled for fallback story: ${event.title}`,
          );
        }
      } catch (notificationError) {
        console.warn(
          '⚠️ Failed to schedule notification for fallback:',
          notificationError,
        );
      }

      return {
        success: true,
        storyline,
        fallbackUsed: true,
      };
    } catch (error) {
      console.error('Fallback generation error:', error);
      return {
        success: false,
        error: 'Failed to create fallback storyline',
        errorType: AIErrorType.UNKNOWN_ERROR,
      };
    }
  }

  /**
   * Build story context for AI generation
   */
  private static async buildStoryContext(
    event: Event,
    user: User,
    theme: Theme,
    includeContext: boolean = true,
  ): Promise<StoryContext> {
    const context: StoryContext = {
      eventTitle: event.title,
      eventDescription: event.description || undefined,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || undefined,
      attendeeCount: event.attendeeCount || undefined,
      meetingLink: event.meetingLink || undefined,
      userAge: user.age || undefined,
      userGender: user.gender || undefined,
      userTimezone: user.timezone,
      theme,
    };

    // Add previous stories for context if requested
    if (includeContext) {
      context.previousStories = await this.getPreviousStoryContext(
        user.id,
        theme,
      );
    }

    return context;
  }

  /**
   * Get previous story context for better continuity
   */
  private static async getPreviousStoryContext(
    userId: string,
    theme: Theme,
  ): Promise<PreviousStoryContext[]> {
    try {
      const recentStorylines = await prisma.storyline.findMany({
        where: {
          userId,
          theme,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      // Get event details for each storyline
      const storylinesWithEvents = await Promise.all(
        recentStorylines.map(async (storyline) => {
          const event = await prisma.event.findUnique({
            where: { id: storyline.eventId },
            select: { title: true, startTime: true },
          });

          return {
            storyline,
            event,
          };
        }),
      );

      return storylinesWithEvents
        .filter((item) => item.event !== null)
        .map((item) => ({
          eventTitle: item.event!.title,
          storyText: item.storyline.storyText,
          theme: item.storyline.theme,
          eventDate: item.event!.startTime,
        }));
    } catch (error) {
      console.warn('Failed to get previous story context:', error);
      return [];
    }
  }

  /**
   * Save storyline to database
   */
  private static async saveStoryline(
    event: Event,
    userId: string,
    theme: Theme,
    response:
      | AIResponse
      | {
          storyText: string;
          emoji: string;
          plainText: string;
          provider?: AIProvider;
        },
    isFallback: boolean,
  ): Promise<Storyline> {
    // 🔧 FIX: Base expiration on creation time, not event time
    // This allows storylines for past events to persist
    const expiresAt = new Date(
      Date.now() + APP_CONFIG.STORYLINE_CACHE_HOURS * 60 * 60 * 1000,
    );

    console.log('💾 Saving storyline:', {
      eventId: event.id,
      eventTitle: event.title,
      userId,
      theme,
      expiresAt: expiresAt.toISOString(),
      isFallback,
      hasProvider: !!response.provider,
    });

    return await prisma.storyline.upsert({
      where: {
        eventId_theme: {
          eventId: event.id,
          theme,
        },
      },
      create: {
        userId,
        eventId: event.id,
        theme,
        storyText: response.storyText,
        plainText: response.plainText,
        emoji: response.emoji,
        aiProvider: isFallback ? null : response.provider,
        tokensUsed: 'tokensUsed' in response ? response.tokensUsed : null,
        isActive: true,
        expiresAt,
      },
      update: {
        storyText: response.storyText,
        plainText: response.plainText,
        emoji: response.emoji,
        aiProvider: isFallback ? null : response.provider,
        tokensUsed: 'tokensUsed' in response ? response.tokensUsed : null,
        isActive: true,
        expiresAt,
      },
    });
  }

  /**
   * Create fallback response when AI is not available
   */
  private static createFallbackResponse(
    event: Event,
    theme: Theme,
  ): {
    storyText: string;
    emoji: string;
    plainText: string;
  } {
    const timeStr = event.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const themeConfig = StoryPromptService.getThemeConfig(theme);
    const emoji = themeConfig.emojis[0] || '📅';

    let storyText: string;

    switch (theme) {
      case Theme.FANTASY:
        storyText = `${emoji} The fellowship gathers for "${event.title}" at ${timeStr}. A quest of great importance awaits!`;
        break;

      case Theme.GENZ:
        storyText = `${emoji} "${event.title}" at ${timeStr} bestie! Time to slay and get these goals, no cap!`;
        break;

      case Theme.MEME:
        storyText = `${emoji} "${event.title}" at ${timeStr}... this is fine, everything is fine ${emoji}`;
        break;

      default:
        storyText = `${emoji} ${event.title} scheduled for ${timeStr}`;
    }

    return {
      storyText,
      emoji,
      plainText: `${event.title} at ${timeStr}`,
    };
  }

  /**
   * Clean up expired storylines
   */
  static async cleanupExpiredStorylines(): Promise<number> {
    try {
      const result = await prisma.storyline.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
        },
      });

      console.log(`Cleaned up ${result.count} expired storylines`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired storylines:', error);
      return 0;
    }
  }

  /**
   * Get storyline statistics for user
   */
  static async getStorylineStats(userId: string): Promise<{
    total: number;
    byTheme: Record<Theme, number>;
    byProvider: Record<AIProvider, number>;
    totalTokensUsed: number;
    fallbackCount: number;
  }> {
    try {
      const storylines = await prisma.storyline.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      const stats = {
        total: storylines.length,
        byTheme: {} as Record<Theme, number>,
        byProvider: {} as Record<AIProvider, number>,
        totalTokensUsed: 0,
        fallbackCount: 0,
      };

      // Initialize theme counts
      Object.values(Theme).forEach((theme) => {
        stats.byTheme[theme] = 0;
      });

      // Initialize provider counts
      Object.values(AIProvider).forEach((provider) => {
        stats.byProvider[provider] = 0;
      });

      // Calculate stats
      storylines.forEach((storyline) => {
        stats.byTheme[storyline.theme]++;

        if (storyline.aiProvider) {
          stats.byProvider[storyline.aiProvider]++;
          stats.totalTokensUsed += storyline.tokensUsed || 0;
        } else {
          stats.fallbackCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get storyline stats:', error);
      throw error;
    }
  }
}
