/**
 * AI Service - High-level AI management and user interactions
 */

import { AIProvider, Theme, User } from '@prisma/client';
import { prisma } from '@/database/db';
import {
  AIManager,
  AIProviderFactory,
} from '@/shared/providers/ai/ai-provider.factory';
import { StoryGenerationService } from '@/shared/services/story-generation.service';
import { decrypt, encrypt } from '@/shared/utils/encryption.util';
import { AIErrorType, AIGenerationError } from '@/shared/types/ai.types';

export interface AISettingsUpdateDto {
  aiProvider?: AIProvider;
  aiApiKey?: string;
  aiModel?: string;
}

export interface APIKeyValidationResult {
  isValid: boolean;
  provider: AIProvider;
  supportedModels: string[];
  defaultModel: string;
  error?: string;
  testResponse?: {
    success: boolean;
    latencyMs: number;
    model: string;
  };
}

export interface AIProviderInfo {
  provider: AIProvider;
  name: string;
  description: string;
  defaultModel: string;
  supportedModels: string[];
  maxTokens: number;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  reliability: 'high' | 'medium' | 'low';
  setupComplexity: 'easy' | 'medium' | 'hard';
  features: string[];
}

export class AIService {
  /**
   * Update user's AI settings with validation
   */
  static async updateUserAISettings(
    userId: string,
    settings: AISettingsUpdateDto,
  ): Promise<{
    success: boolean;
    user?: User;
    validationResult?: APIKeyValidationResult;
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Validate API key if provided
      if (settings.aiApiKey && settings.aiProvider) {
        const validationResult = await this.validateAPIKey(
          settings.aiProvider,
          settings.aiApiKey,
          settings.aiModel,
        );

        if (!validationResult.isValid) {
          return {
            success: false,
            error: 'API key validation failed',
            validationResult,
          };
        }

        // Encrypt API key before storing
        const encryptedApiKey = encrypt(settings.aiApiKey);

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            aiProvider: settings.aiProvider,
            aiApiKey: encryptedApiKey,
            aiModel: settings.aiModel || validationResult.defaultModel,
          },
        });

        return {
          success: true,
          user: {
            ...updatedUser,
            aiApiKey: '***encrypted***', // Don't return the actual key
          } as User,
          validationResult,
        };
      }

      // Update other settings without API key
      const updateData: any = {};
      if (settings.aiProvider) updateData.aiProvider = settings.aiProvider;
      if (settings.aiModel) updateData.aiModel = settings.aiModel;

      if (Object.keys(updateData).length > 0) {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        return { success: true, user: updatedUser };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Failed to update AI settings:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update AI settings';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate API key for any provider
   */
  static async validateAPIKey(
    provider: AIProvider,
    apiKey: string,
    model?: string,
  ): Promise<APIKeyValidationResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 AI Service: Starting API key validation...');
      console.log('🏭 Provider:', provider);
      console.log('🤖 Model:', model || 'default');
      console.log('🔑 API Key length:', apiKey?.length || 0);
      console.log('🔑 API Key preview:', `${apiKey?.substring(0, 15)}...`);

      const aiProvider = AIProviderFactory.getProvider(provider);
      const providerInfo = AIProviderFactory.getProviderInfo(provider);

      console.log('✅ Provider created successfully:', {
        name: aiProvider.name,
        defaultModel: providerInfo.defaultModel,
        supportedModels: providerInfo.supportedModels.slice(0, 3), // Show first 3
      });

      // Basic validation
      console.log('🔑 Validating API key...');
      const validationStartTime = Date.now();
      const isValid = await aiProvider.validateApiKey(apiKey);
      const validationDuration = Date.now() - validationStartTime;

      console.log(
        `⏱️ Validation completed in ${validationDuration}ms, result: ${isValid}`,
      );

      if (!isValid) {
        console.log('❌ API key validation failed');
        return {
          isValid: false,
          provider,
          supportedModels: providerInfo.supportedModels,
          defaultModel: providerInfo.defaultModel,
          error: 'API key validation failed',
        };
      }

      console.log(
        '✅ API key validation passed, proceeding to test generation...',
      );

      // Test generation if key is valid
      let testResponse;
      try {
        const testRequest = {
          prompt:
            'Return this exact JSON: {"story_text": "Test successful", "emoji": "✅", "plain_text": "Test"}',
          apiKey,
          model: model || providerInfo.defaultModel,
          maxTokens: 50,
          temperature: 0.1,
        };

        const response = await aiProvider.generateStory(testRequest, {
          eventTitle: 'Test Event',
          startTime: new Date(),
          endTime: new Date(),
          userTimezone: 'UTC',
          theme: Theme.FANTASY,
        });

        testResponse = {
          success: true,
          latencyMs: Date.now() - startTime,
          model: response.model || providerInfo.defaultModel,
        };
      } catch (testError) {
        console.warn('Test generation failed but API key is valid:', testError);
        testResponse = {
          success: false,
          latencyMs: Date.now() - startTime,
          model: model || providerInfo.defaultModel,
        };
      }

      return {
        isValid: true,
        provider,
        supportedModels: providerInfo.supportedModels,
        defaultModel: providerInfo.defaultModel,
        testResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown validation error';
      return {
        isValid: false,
        provider,
        supportedModels:
          AIProviderFactory.getProviderInfo(provider).supportedModels,
        defaultModel: AIProviderFactory.getProviderInfo(provider).defaultModel,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all available models organized by provider
   */
  static getAllModels(): Record<
    AIProvider,
    { models: string[]; defaultModel: string }
  > {
    const result = {} as Record<
      AIProvider,
      { models: string[]; defaultModel: string }
    >;

    // Only use supported providers instead of all enum values
    const supportedProviders = [
      AIProvider.GEMINI,
      AIProvider.OPENAI,
      AIProvider.CLAUDE,
    ];

    supportedProviders.forEach((provider) => {
      try {
        const providerInfo = AIProviderFactory.getProviderInfo(provider);
        result[provider] = {
          models: providerInfo.supportedModels,
          defaultModel: providerInfo.defaultModel,
        };
      } catch (error) {
        console.warn(`Skipping unsupported provider ${provider}:`, error);
      }
    });

    return result;
  }

  /**
   * Get models for a specific provider
   */
  static getProviderModels(provider: AIProvider): string[] {
    try {
      const providerInfo = AIProviderFactory.getProviderInfo(provider);
      return providerInfo.supportedModels;
    } catch (error) {
      console.warn(`Unsupported provider ${provider}:`, error);
      return [];
    }
  }

  /**
   * Get all available AI providers with detailed information
   */
  static getAllProviderInfo(): AIProviderInfo[] {
    const supportedProviders = [
      AIProvider.GEMINI,
      AIProvider.OPENAI,
      AIProvider.CLAUDE,
    ];

    return supportedProviders.map((provider) => {
      const providerInfo = AIProviderFactory.getProviderInfo(provider);

      // Add UI metadata for each provider
      const metadata = {
        [AIProvider.GEMINI]: {
          name: 'Google Gemini',
          description:
            'Fast, free-tier available, good for high-volume generation',
          estimatedCost: 'low' as const,
          estimatedSpeed: 'fast' as const,
          reliability: 'high' as const,
          setupComplexity: 'easy' as const,
          features: [
            'Free tier available',
            'Fast response times',
            'Good for creative writing',
            'Multilingual support',
            'Safety filtering built-in',
          ],
        },
        [AIProvider.OPENAI]: {
          name: 'OpenAI GPT',
          description:
            'High-quality generation, wide model selection, excellent for varied content',
          estimatedCost: 'medium' as const,
          estimatedSpeed: 'medium' as const,
          reliability: 'high' as const,
          setupComplexity: 'easy' as const,
          features: [
            'Multiple model options',
            'Excellent consistency',
            'JSON mode support',
            'Wide knowledge base',
            'Strong reasoning capabilities',
          ],
        },
        [AIProvider.CLAUDE]: {
          name: 'Anthropic Claude',
          description:
            'Thoughtful, nuanced responses, excellent for professional content',
          estimatedCost: 'high' as const,
          estimatedSpeed: 'medium' as const,
          reliability: 'medium' as const,
          setupComplexity: 'medium' as const,
          features: [
            'Thoughtful responses',
            'Strong safety focus',
            'Good for professional tone',
            'Detailed reasoning',
            'Constitutional AI approach',
          ],
        },
      };

      return {
        provider,
        ...metadata[provider],
        defaultModel: providerInfo.defaultModel,
        supportedModels: providerInfo.supportedModels,
        maxTokens: providerInfo.maxTokens,
      };
    });
  }

  /**
   * Get user's current AI configuration
   */
  static async getUserAIConfig(userId: string): Promise<{
    provider: AIProvider;
    model: string;
    hasValidKey: boolean;
    keyLastValidated?: Date;
    providerInfo: AIProviderInfo;
  } | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;

      const providerInfo = this.getAllProviderInfo().find(
        (p) => p.provider === user.aiProvider,
      );
      if (!providerInfo) return null;

      // Check if API key exists and was recently validated
      const hasValidKey = !!user.aiApiKey;

      return {
        provider: user.aiProvider,
        model: user.aiModel || providerInfo.defaultModel,
        hasValidKey,
        providerInfo,
      };
    } catch (error) {
      console.error('Failed to get user AI config:', error);
      return null;
    }
  }

  /**
   * Test user's current AI setup
   */
  static async testUserAISetup(userId: string): Promise<{
    success: boolean;
    provider: AIProvider;
    model: string;
    latencyMs: number;
    testStory?: string;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.aiApiKey) {
        return {
          success: false,
          provider: user?.aiProvider || AIProvider.GEMINI,
          model: 'none',
          latencyMs: Date.now() - startTime,
          error: 'No AI configuration found',
        };
      }

      const provider = AIProviderFactory.getProvider(user.aiProvider);
      const decryptedKey = decrypt(user.aiApiKey);

      const testRequest = {
        prompt:
          'Generate a test story JSON: {"story_text": "🧪 Test meeting at 2PM - checking the mystical AI connection!", "emoji": "🧪", "plain_text": "Test meeting at 2PM"}',
        apiKey: decryptedKey,
        model: user.aiModel || provider.getDefaultModel(),
        maxTokens: 100,
        temperature: 0.7,
      };

      const response = await provider.generateStory(testRequest, {
        eventTitle: 'Test Meeting',
        startTime: new Date(),
        endTime: new Date(),
        userTimezone: 'UTC',
        theme: user.selectedTheme,
      });

      return {
        success: true,
        provider: user.aiProvider,
        model: response.model || user.aiModel || provider.getDefaultModel(),
        latencyMs: Date.now() - startTime,
        testStory: response.storyText,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Test failed';
      return {
        success: false,
        provider: AIProvider.GEMINI, // Default provider when error occurs
        model: 'unknown',
        latencyMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get AI usage statistics for user
   */
  static async getUserAIStats(userId: string): Promise<{
    totalGenerations: number;
    totalTokensUsed: number;
    averageTokensPerGeneration: number;
    byProvider: Record<AIProvider, { count: number; tokens: number }>;
    byTheme: Record<Theme, { count: number; tokens: number }>;
    successRate: number;
    lastGeneration?: Date;
  }> {
    try {
      const storylines = await prisma.storyline.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const stats = {
        totalGenerations: storylines.length,
        totalTokensUsed: 0,
        averageTokensPerGeneration: 0,
        byProvider: {} as Record<AIProvider, { count: number; tokens: number }>,
        byTheme: {} as Record<Theme, { count: number; tokens: number }>,
        successRate: 0,
        lastGeneration: storylines[0]?.createdAt,
      };

      // Initialize counters
      Object.values(AIProvider).forEach((provider) => {
        stats.byProvider[provider] = { count: 0, tokens: 0 };
      });

      Object.values(Theme).forEach((theme) => {
        stats.byTheme[theme] = { count: 0, tokens: 0 };
      });

      // Calculate stats
      let aiGeneratedCount = 0;
      storylines.forEach((storyline) => {
        const tokens = storyline.tokensUsed || 0;
        stats.totalTokensUsed += tokens;

        stats.byTheme[storyline.theme].count++;
        stats.byTheme[storyline.theme].tokens += tokens;

        if (storyline.aiProvider) {
          stats.byProvider[storyline.aiProvider].count++;
          stats.byProvider[storyline.aiProvider].tokens += tokens;
          aiGeneratedCount++;
        }
      });

      stats.averageTokensPerGeneration =
        stats.totalGenerations > 0
          ? Math.round(stats.totalTokensUsed / stats.totalGenerations)
          : 0;

      stats.successRate =
        stats.totalGenerations > 0
          ? Math.round((aiGeneratedCount / stats.totalGenerations) * 100)
          : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get AI stats:', error);
      throw error;
    }
  }

  /**
   * Recommend best AI provider for user based on usage patterns
   */
  static async getProviderRecommendation(userId: string): Promise<{
    recommended: AIProvider;
    reason: string;
    alternatives: Array<{
      provider: AIProvider;
      reason: string;
      score: number;
    }>;
  }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const stats = await this.getUserAIStats(userId);

      // Simple recommendation logic based on usage and preferences
      const recommendations = [];

      // Gemini - good for high volume, cost-conscious users
      let geminiScore = 70;
      if (stats.totalGenerations > 100) geminiScore += 20; // High volume
      if (!user?.aiApiKey) geminiScore += 10; // No current setup
      recommendations.push({
        provider: AIProvider.GEMINI,
        reason:
          'Fast, cost-effective, and reliable for high-volume story generation',
        score: geminiScore,
      });

      // OpenAI - good for quality-focused users
      let openaiScore = 80;
      if (stats.successRate < 90) openaiScore += 15; // Needs reliability
      if (stats.totalGenerations < 50) openaiScore += 10; // Lower volume
      recommendations.push({
        provider: AIProvider.OPENAI,
        reason:
          'Best overall quality and consistency for professional storytelling',
        score: openaiScore,
      });

      // Claude - good for professional, nuanced content
      let claudeScore = 60;
      if (user?.selectedTheme === Theme.FANTASY) claudeScore += 15; // Good for creative content
      if (stats.totalGenerations < 20) claudeScore += 10; // Low volume OK
      recommendations.push({
        provider: AIProvider.CLAUDE,
        reason:
          'Thoughtful, professional tone perfect for sophisticated storytelling',
        score: claudeScore,
      });

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      return {
        recommended: recommendations[0].provider,
        reason: recommendations[0].reason,
        alternatives: recommendations.slice(1),
      };
    } catch (error) {
      console.error('Failed to get provider recommendation:', error);
      // Default fallback
      return {
        recommended: AIProvider.GEMINI,
        reason: 'Default recommendation - fast and reliable',
        alternatives: [
          {
            provider: AIProvider.OPENAI,
            reason: 'Higher quality alternative',
            score: 70,
          },
        ],
      };
    }
  }

  /**
   * Clear user's AI configuration
   */
  static async clearUserAIConfig(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiApiKey: null,
          aiModel: null,
          // Keep aiProvider as it has a default
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to clear AI config:', error);
      return false;
    }
  }

  /**
   * Clear user's API key (useful for encryption mismatch issues)
   */
  static async clearUserAPIKey(userId: string): Promise<void> {
    try {
      console.log(
        `🔄 Clearing API key for user ${userId} due to encryption issues`,
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          aiApiKey: null,
          aiModel: null,
          // Keep aiProvider as it has a default and is not nullable
        },
      });

      console.log(
        `✅ API key cleared for user ${userId} - they can now re-configure in AI Settings`,
      );
    } catch (error) {
      console.error('❌ Failed to clear user API key:', error);
      throw new Error('Failed to clear user API key');
    }
  }
}
