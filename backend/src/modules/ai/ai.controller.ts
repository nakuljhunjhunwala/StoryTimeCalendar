/**
 * AI Controller - Handle AI-related API endpoints
 */

import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { StoryGenerationService } from '@/shared/services/story-generation.service';
import { AIProvider, Theme } from '@prisma/client';
import { ResponseUtil } from '@/shared/utils/response.util';

export class AIController {
  /**
   * Get all available AI providers with information
   */
  static async getProviders(req: Request, res: Response) {
    try {
      const providers = AIService.getAllProviderInfo();

      return ResponseUtil.success(
        res,
        {
          providers,
          totalProviders: providers.length,
        },
        'AI providers retrieved successfully',
      );
    } catch (error) {
      console.error('Get providers error:', error);
      return ResponseUtil.error(res, 'Failed to get AI providers', 500);
    }
  }

  /**
   * Get all available models for all providers
   */
  static async getAllModels(req: Request, res: Response) {
    try {
      const modelsByProvider = AIService.getAllModels();

      return ResponseUtil.success(
        res,
        {
          models: modelsByProvider,
          totalProviders: Object.keys(modelsByProvider).length,
        },
        'AI models retrieved successfully',
      );
    } catch (error) {
      console.error('Get models error:', error);
      return ResponseUtil.error(res, 'Failed to get AI models', 500);
    }
  }

  /**
   * Get models for a specific provider
   */
  static async getProviderModels(req: Request, res: Response) {
    try {
      const { provider } = req.params;

      // Only allow supported providers
      const supportedProviders = [
        AIProvider.GEMINI,
        AIProvider.OPENAI,
        AIProvider.CLAUDE,
      ];
      if (!supportedProviders.map((p) => p.toString()).includes(provider)) {
        return ResponseUtil.error(res, 'Unsupported AI provider', 400);
      }

      const models = AIService.getProviderModels(provider as AIProvider);

      return ResponseUtil.success(
        res,
        {
          provider,
          models,
          totalModels: models.length,
        },
        `Models for ${provider} retrieved successfully`,
      );
    } catch (error) {
      console.error('Get provider models error:', error);
      return ResponseUtil.error(res, 'Failed to get provider models', 500);
    }
  }

  /**
   * Get user's current AI configuration
   */
  static async getUserConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const config = await AIService.getUserAIConfig(userId);
      if (!config) {
        return ResponseUtil.error(res, 'User configuration not found', 404);
      }

      return ResponseUtil.success(
        res,
        config,
        'AI configuration retrieved successfully',
      );
    } catch (error) {
      console.error('Get user config error:', error);
      return ResponseUtil.error(res, 'Failed to get AI configuration', 500);
    }
  }

  /**
   * Update user's AI settings
   */
  static async updateUserSettings(req: Request, res: Response) {
    try {
      console.log('🎛️ AI Controller: Update user settings request received');
      console.log('📋 Request body preview:', {
        aiProvider: req.body?.aiProvider,
        hasApiKey: !!req.body?.aiApiKey,
        apiKeyLength: req.body?.aiApiKey?.length || 0,
        aiModel: req.body?.aiModel,
      });

      const userId = (req as any).user?.userId;
      if (!userId) {
        console.error('❌ User not authenticated');
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      console.log('👤 User ID:', userId);

      const { aiProvider, aiApiKey, aiModel } = req.body;

      // Validate provider if provided - only allow supported providers
      const supportedProviders = [
        AIProvider.GEMINI,
        AIProvider.OPENAI,
        AIProvider.CLAUDE,
      ];
      console.log(
        '🔍 Supported providers:',
        supportedProviders.map((p) => p.toString()),
      );
      console.log('🔍 Requested provider:', aiProvider);

      if (
        aiProvider &&
        !supportedProviders.map((p) => p.toString()).includes(aiProvider)
      ) {
        console.error('❌ Unsupported AI provider:', aiProvider);
        return ResponseUtil.error(res, 'Unsupported AI provider', 400);
      }

      console.log('✅ Provider validation passed, calling AI service...');

      const result = await AIService.updateUserAISettings(userId, {
        aiProvider,
        aiApiKey,
        aiModel,
      });

      console.log('📊 AI Service result:', {
        success: result.success,
        hasUser: !!result.user,
        hasValidation: !!result.validationResult,
        error: result.error,
      });

      if (!result.success) {
        console.error('❌ AI Service update failed:', result.error);
        return ResponseUtil.error(
          res,
          result.error || 'Failed to update AI settings',
          400,
          {
            validationResult: result.validationResult,
          },
        );
      }

      console.log('✅ AI settings updated successfully');
      return ResponseUtil.success(
        res,
        {
          user: result.user,
          validationResult: result.validationResult,
        },
        'AI settings updated successfully',
      );
    } catch (error) {
      console.error('❌ Update AI settings error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return ResponseUtil.error(res, 'Failed to update AI settings', 500);
    }
  }

  /**
   * Validate API key for a specific provider
   */
  static async validateApiKey(req: Request, res: Response) {
    try {
      const { provider, apiKey, model } = req.body;

      if (!provider || !apiKey) {
        return ResponseUtil.error(
          res,
          'Provider and API key are required',
          400,
        );
      }

      // Only allow supported providers
      const supportedProviders = [
        AIProvider.GEMINI,
        AIProvider.OPENAI,
        AIProvider.CLAUDE,
      ];
      if (!supportedProviders.map((p) => p.toString()).includes(provider)) {
        return ResponseUtil.error(res, 'Unsupported AI provider', 400);
      }

      const validationResult = await AIService.validateAPIKey(
        provider,
        apiKey,
        model,
      );

      return ResponseUtil.success(
        res,
        validationResult,
        validationResult.isValid
          ? 'API key is valid'
          : 'API key validation failed',
      );
    } catch (error) {
      console.error('API key validation error:', error);
      return ResponseUtil.error(res, 'Failed to validate API key', 500);
    }
  }

  /**
   * Test user's current AI setup
   */
  static async testUserSetup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const testResult = await AIService.testUserAISetup(userId);

      return ResponseUtil.success(
        res,
        testResult,
        testResult.success
          ? 'AI setup test successful'
          : 'AI setup test failed',
      );
    } catch (error) {
      console.error('AI setup test error:', error);
      return ResponseUtil.error(res, 'Failed to test AI setup', 500);
    }
  }

  /**
   * Get AI usage statistics for user
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const stats = await AIService.getUserAIStats(userId);

      return ResponseUtil.success(
        res,
        stats,
        'AI statistics retrieved successfully',
      );
    } catch (error) {
      console.error('Get AI stats error:', error);
      return ResponseUtil.error(res, 'Failed to get AI statistics', 500);
    }
  }

  /**
   * Get provider recommendation for user
   */
  static async getProviderRecommendation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const recommendation = await AIService.getProviderRecommendation(userId);

      return ResponseUtil.success(
        res,
        recommendation,
        'Provider recommendation retrieved successfully',
      );
    } catch (error) {
      console.error('Get provider recommendation error:', error);
      return ResponseUtil.error(
        res,
        'Failed to get provider recommendation',
        500,
      );
    }
  }

  /**
   * Generate storyline for specific event
   */
  static async generateStoryline(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const { eventId } = req.params;
      const { theme, forceRegenerate, includeContext } = req.body;

      if (!eventId) {
        return ResponseUtil.error(res, 'Event ID is required', 400);
      }

      // Validate theme if provided
      if (theme && !Object.values(Theme).includes(theme)) {
        return ResponseUtil.error(res, 'Invalid theme', 400);
      }

      const result = await StoryGenerationService.generateStorylineForEvent(
        eventId,
        userId,
        theme,
        {
          forceRegenerate: forceRegenerate === true,
          includeContext: includeContext !== false, // Default to true
          maxRetries: 2,
        },
      );

      if (!result.success) {
        return ResponseUtil.error(
          res,
          result.error || 'Failed to generate storyline',
          400,
          {
            errorType: result.errorType,
            fallbackUsed: result.fallbackUsed,
          },
        );
      }

      return ResponseUtil.success(
        res,
        {
          storyline: result.storyline,
          tokensUsed: result.tokensUsed,
          fallbackUsed: result.fallbackUsed,
        },
        'Storyline generated successfully',
      );
    } catch (error) {
      console.error('Generate storyline error:', error);
      return ResponseUtil.error(res, 'Failed to generate storyline', 500);
    }
  }

  /**
   * Generate storylines for multiple events
   */
  static async generateMultipleStorylines(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const { eventIds, theme, forceRegenerate, includeContext } = req.body;

      if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        return ResponseUtil.error(res, 'Event IDs array is required', 400);
      }

      if (eventIds.length > 20) {
        return ResponseUtil.error(res, 'Too many events (max 20)', 400);
      }

      // Validate theme if provided
      if (theme && !Object.values(Theme).includes(theme)) {
        return ResponseUtil.error(res, 'Invalid theme', 400);
      }

      const results = await StoryGenerationService.generateStorylinesForEvents(
        eventIds,
        userId,
        theme,
        {
          forceRegenerate: forceRegenerate === true,
          includeContext: includeContext !== false,
          maxRetries: 2,
        },
      );

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return ResponseUtil.success(
        res,
        {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            successRate: Math.round((successCount / results.length) * 100),
          },
        },
        `Generated storylines for ${successCount}/${results.length} events`,
      );
    } catch (error) {
      console.error('Generate multiple storylines error:', error);
      return ResponseUtil.error(res, 'Failed to generate storylines', 500);
    }
  }

  /**
   * Generate storylines for all user's upcoming events
   */
  static async generateUserStorylines(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const { forceRegenerate, includeContext } = req.body;

      const result = await StoryGenerationService.generateStorylinesForUser(
        userId,
        {
          forceRegenerate: forceRegenerate === true,
          includeContext: includeContext !== false,
          maxRetries: 2,
        },
      );

      return ResponseUtil.success(
        res,
        result,
        `Generated storylines for ${result.successfulGeneration}/${result.totalEvents} events`,
      );
    } catch (error) {
      console.error('Generate user storylines error:', error);
      return ResponseUtil.error(res, 'Failed to generate user storylines', 500);
    }
  }

  /**
   * Clear user's AI configuration
   */
  static async clearUserConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return ResponseUtil.error(res, 'User not authenticated', 401);
      }

      const success = await AIService.clearUserAIConfig(userId);

      if (!success) {
        return ResponseUtil.error(res, 'Failed to clear AI configuration', 500);
      }

      return ResponseUtil.success(
        res,
        { cleared: true },
        'AI configuration cleared successfully',
      );
    } catch (error) {
      console.error('Clear AI config error:', error);
      return ResponseUtil.error(res, 'Failed to clear AI configuration', 500);
    }
  }
}
