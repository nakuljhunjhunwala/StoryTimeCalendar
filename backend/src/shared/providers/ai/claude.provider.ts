/**
 * Anthropic Claude AI Provider Implementation
 */

import { AIProvider } from '@prisma/client';
import { BaseAIProvider } from './base-ai.provider';
import {
  AIErrorType,
  AIGenerationError,
  AIRequest,
  AIStoryResponse,
} from '@/shared/types/ai.types';
import { EXTERNAL_APIS } from '@/shared/constants/app.constants';

export class ClaudeProvider extends BaseAIProvider {
  name = AIProvider.CLAUDE;

  getDefaultModel(): string {
    return 'claude-3-7-sonnet-20250219'; // Most cost-effective latest version
  }

  getSupportedModels(): string[] {
    return [
      'claude-3-7-sonnet-20250219', // Most cost-effective
      'claude-sonnet-4-20250514',
      'claude-opus-4-1-20250805',
    ];
  }

  getMaxTokens(): number {
    return 4096;
  }

  getDefaultTemperature(): number {
    return 0.7;
  }

  /**
   * Make API request to Claude
   */
  protected async makeAPIRequest(request: AIRequest): Promise<any> {
    const requestBody = {
      model: request.model || this.getDefaultModel(),
      max_tokens: request.maxTokens || 150,
      temperature: request.temperature || this.getDefaultTemperature(),
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      system:
        'You are a creative story generator. CRITICAL: You MUST respond with ONLY valid JSON containing exactly these fields: story_text, emoji, and plain_text. Do not include any explanations, markdown, or text outside the JSON object. The response must be parseable JSON.',
    };

    try {
      const response = await fetch(EXTERNAL_APIS.CLAUDE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': request.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        this.handleHttpError(new Error(`HTTP ${response.status}`), response);
      }

      const data = await this.safeJsonParse(response);

      // Claude specific error handling
      if (data.error) {
        if (data.error.type === 'authentication_error') {
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Invalid Claude API key',
            this.name,
          );
        }

        if (data.error.type === 'rate_limit_error') {
          throw new AIGenerationError(
            AIErrorType.RATE_LIMIT_EXCEEDED,
            'Claude API rate limit exceeded',
            this.name,
          );
        }

        if (data.error.type === 'overloaded_error') {
          throw new AIGenerationError(
            AIErrorType.RATE_LIMIT_EXCEEDED,
            'Claude API is overloaded',
            this.name,
          );
        }

        throw new AIGenerationError(
          AIErrorType.UNKNOWN_ERROR,
          `Claude API error: ${data.error.message}`,
          this.name,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }
      this.handleHttpError(error);
    }
  }

  /**
   * Parse Claude response to standard format
   */
  protected parseResponse(response: any): AIStoryResponse {
    try {
      // Claude returns content array
      if (!response.content || response.content.length === 0) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No content in Claude response',
          this.name,
        );
      }

      const content = response.content[0];

      if (!content.text) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No text in Claude content',
          this.name,
        );
      }

      const text = content.text.trim();

      // 🔧 UNIVERSAL FIX: Use the base class universal JSON parser
      return this.parseJsonResponse(text);
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        `Failed to parse Claude response: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Parse structured text response (fallback method)
   */

  /**
   * Validate API key with test request
   */
  protected async validateApiKeyImpl(apiKey: string): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        prompt:
          'Please respond with this exact JSON format: {"story_text": "Test story", "emoji": "🧪", "plain_text": "Test"}',
        apiKey,
        maxTokens: 50,
        temperature: 0.1,
      };

      await this.makeAPIRequest(testRequest);
      return true;
    } catch (error) {
      if (
        error instanceof AIGenerationError &&
        error.type === AIErrorType.INVALID_API_KEY
      ) {
        return false;
      }
      console.warn(
        'Claude API key validation encountered non-auth error:',
        error,
      );
      return false;
    }
  }

  /**
   * Extract token usage from Claude response
   */
  protected extractTokensUsed(rawResponse: any): number | undefined {
    try {
      if (rawResponse.usage) {
        return rawResponse.usage.input_tokens + rawResponse.usage.output_tokens;
      }
    } catch (error) {
      console.warn(
        'Could not extract token usage from Claude response:',
        error,
      );
    }
    return undefined;
  }
}
