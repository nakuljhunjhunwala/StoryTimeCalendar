/**
 * AI Provider Factory and Manager
 */

import { AIProvider } from '@prisma/client';
import {
  AIErrorType,
  AIGenerationError,
  IAIProvider,
} from '@/shared/types/ai.types';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';

export class AIProviderFactory {
  private static providers: Map<AIProvider, IAIProvider> = new Map();

  /**
   * Get AI provider instance by type
   */
  static getProvider(providerType: AIProvider): IAIProvider {
    if (!this.providers.has(providerType)) {
      const provider = this.createProvider(providerType);
      this.providers.set(providerType, provider);
    }

    return this.providers.get(providerType)!;
  }

  /**
   * Create new provider instance
   */
  private static createProvider(providerType: AIProvider): IAIProvider {
    switch (providerType) {
      case AIProvider.GEMINI:
        return new GeminiProvider();

      case AIProvider.OPENAI:
        return new OpenAIProvider();

      case AIProvider.CLAUDE:
        return new ClaudeProvider();

      default:
        throw new AIGenerationError(
          AIErrorType.INVALID_REQUEST,
          `Unsupported AI provider: ${providerType}`,
          providerType,
        );
    }
  }

  /**
   * Get all available providers
   */
  static getAllProviders(): AIProvider[] {
    return Object.values(AIProvider);
  }

  /**
   * Check if provider is supported
   */
  static isProviderSupported(providerType: string): boolean {
    return Object.values(AIProvider).includes(providerType as AIProvider);
  }

  /**
   * Get provider info
   */
  static getProviderInfo(providerType: AIProvider) {
    const provider = this.getProvider(providerType);

    return {
      name: provider.name,
      defaultModel: provider.getDefaultModel(),
      supportedModels: provider.getSupportedModels(),
      maxTokens: provider.getMaxTokens(),
      defaultTemperature: provider.getDefaultTemperature(),
    };
  }

  /**
   * Validate API key for any provider
   */
  static async validateApiKey(
    providerType: AIProvider,
    apiKey: string,
  ): Promise<boolean> {
    try {
      const provider = this.getProvider(providerType);
      return await provider.validateApiKey(apiKey);
    } catch (error) {
      console.error(`Failed to validate API key for ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Clear cached providers (useful for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

/**
 * AI Manager Service - Higher level management
 */
export class AIManager {
  /**
   * Test connection to all providers with given API keys
   */
  static async testProviderConnections(
    providerConfigs: Array<{
      provider: AIProvider;
      apiKey: string;
    }>,
  ): Promise<
    Array<{
      provider: AIProvider;
      isValid: boolean;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      providerConfigs.map(async (config) => {
        try {
          const isValid = await AIProviderFactory.validateApiKey(
            config.provider,
            config.apiKey,
          );
          return {
            provider: config.provider,
            isValid,
            error: isValid ? undefined : 'API key validation failed',
          };
        } catch (error) {
          return {
            provider: config.provider,
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          provider: providerConfigs[index].provider,
          isValid: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Get recommended provider based on user preferences
   */
  static getRecommendedProvider(preferences?: {
    speed?: 'fast' | 'medium' | 'slow';
    cost?: 'low' | 'medium' | 'high';
    quality?: 'basic' | 'good' | 'excellent';
  }): AIProvider {
    if (!preferences) {
      return AIProvider.GEMINI; // Default
    }

    // Simple recommendation logic based on preferences
    if (preferences.speed === 'fast' && preferences.cost === 'low') {
      return AIProvider.GEMINI;
    }

    if (preferences.quality === 'excellent') {
      return AIProvider.CLAUDE;
    }

    if (preferences.cost === 'medium' && preferences.quality === 'good') {
      return AIProvider.OPENAI;
    }

    return AIProvider.GEMINI; // Default fallback
  }

  /**
   * Get provider capabilities comparison
   */
  static getProviderComparison() {
    const providers = AIProviderFactory.getAllProviders();

    return providers.map((provider) => {
      const info = AIProviderFactory.getProviderInfo(provider);
      return {
        provider,
        ...info,
        // Add cost/speed estimates (these could be configurable)
        estimatedCost: this.getProviderCostEstimate(provider),
        estimatedSpeed: this.getProviderSpeedEstimate(provider),
        reliability: this.getProviderReliabilityEstimate(provider),
      };
    });
  }

  private static getProviderCostEstimate(
    provider: AIProvider,
  ): 'low' | 'medium' | 'high' {
    switch (provider) {
      case AIProvider.GEMINI:
        return 'low';
      case AIProvider.OPENAI:
        return 'medium';
      case AIProvider.CLAUDE:
        return 'high';
      default:
        return 'medium';
    }
  }

  private static getProviderSpeedEstimate(
    provider: AIProvider,
  ): 'fast' | 'medium' | 'slow' {
    switch (provider) {
      case AIProvider.GEMINI:
        return 'fast';
      case AIProvider.OPENAI:
        return 'medium';
      case AIProvider.CLAUDE:
        return 'medium';
      default:
        return 'medium';
    }
  }

  private static getProviderReliabilityEstimate(
    provider: AIProvider,
  ): 'high' | 'medium' | 'low' {
    // All providers are generally reliable, but some might have more uptime
    switch (provider) {
      case AIProvider.OPENAI:
        return 'high';
      case AIProvider.GEMINI:
        return 'high';
      case AIProvider.CLAUDE:
        return 'medium';
      default:
        return 'medium';
    }
  }
}
