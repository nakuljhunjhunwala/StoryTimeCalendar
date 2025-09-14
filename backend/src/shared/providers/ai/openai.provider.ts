/**
 * OpenAI Provider Implementation
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

export class OpenAIProvider extends BaseAIProvider {
  name = AIProvider.OPENAI;

  getDefaultModel(): string {
    return 'gpt-4o-mini'; // Most cost-effective option
  }

  getSupportedModels(): string[] {
    return [
      'gpt-4o-mini', // Most cost-effective
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-4o',
      'o3-mini',
      'o4-mini',
    ];
  }

  getMaxTokens(): number {
    return 4096;
  }

  getDefaultTemperature(): number {
    return 0.7;
  }

  /**
   * Make API request to OpenAI
   */
  protected async makeAPIRequest(request: AIRequest): Promise<any> {
    const requestBody = {
      model: request.model || this.getDefaultModel(),
      messages: [
        {
          role: 'system',
          content:
            'You are a creative story generator. Always respond with valid JSON containing exactly these fields: story_text, emoji, and plain_text. Do not include any other text or explanation.',
        },
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      max_tokens: request.maxTokens || 150,
      temperature: request.temperature || this.getDefaultTemperature(),
      response_format: { type: 'json_object' }, // 🔧 UNIVERSAL FIX: Force JSON response
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    try {
      const response = await fetch(EXTERNAL_APIS.OPENAI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        this.handleHttpError(new Error(`HTTP ${response.status}`), response);
      }

      const data = await this.safeJsonParse(response);

      // OpenAI specific error handling
      if (data.error) {
        if (data.error.code === 'invalid_api_key') {
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Invalid OpenAI API key',
            this.name,
          );
        }

        if (data.error.code === 'rate_limit_exceeded') {
          throw new AIGenerationError(
            AIErrorType.RATE_LIMIT_EXCEEDED,
            'OpenAI API rate limit exceeded',
            this.name,
          );
        }

        if (data.error.code === 'insufficient_quota') {
          throw new AIGenerationError(
            AIErrorType.QUOTA_EXCEEDED,
            'OpenAI API quota exceeded',
            this.name,
          );
        }

        throw new AIGenerationError(
          AIErrorType.UNKNOWN_ERROR,
          `OpenAI API error: ${data.error.message}`,
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
   * Parse OpenAI response to standard format
   */
  protected parseResponse(response: any): AIStoryResponse {
    try {
      // OpenAI returns choices array
      if (!response.choices || response.choices.length === 0) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No choices in OpenAI response',
          this.name,
        );
      }

      const choice = response.choices[0];

      if (!choice.message?.content) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No message content in OpenAI choice',
          this.name,
        );
      }

      const content = choice.message.content.trim();

      // 🔧 UNIVERSAL FIX: Use the base class universal JSON parser
      return this.parseJsonResponse(content);
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        `Failed to parse OpenAI response: ${errorMessage}`,
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
          'Return valid JSON with these fields: {"story_text": "Test", "emoji": "🧪", "plain_text": "Test"}',
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
        'OpenAI API key validation encountered non-auth error:',
        error,
      );
      return false;
    }
  }

  /**
   * Extract token usage from OpenAI response
   */
  protected extractTokensUsed(rawResponse: any): number | undefined {
    try {
      if (rawResponse.usage) {
        return rawResponse.usage.total_tokens;
      }
    } catch (error) {
      console.warn(
        'Could not extract token usage from OpenAI response:',
        error,
      );
    }
    return undefined;
  }
}
