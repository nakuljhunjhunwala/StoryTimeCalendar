/**
 * Google Gemini AI Provider Implementation
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

export class GeminiProvider extends BaseAIProvider {
  name = AIProvider.GEMINI;

  getDefaultModel(): string {
    return 'gemini-1.5-flash'; // Cheapest and most stable real model
  }

  getSupportedModels(): string[] {
    return [
      'gemini-1.5-flash', // Most cost-effective and stable
      'gemini-1.5-pro', // Higher quality
      'gemini-pro', // Legacy stable model
      'gemini-1.0-pro', // Alternative stable option
      // Using actual Gemini API model names that exist
    ];
  }

  getMaxTokens(): number {
    return 2048;
  }

  getDefaultTemperature(): number {
    return 0.7;
  }

  /**
   * Make API request to Gemini
   */
  protected async makeAPIRequest(request: AIRequest): Promise<any> {
    // 🔧 FIX: Dynamic model URL construction
    const model = request.model || this.getDefaultModel();
    const url = `${EXTERNAL_APIS.GEMINI_BASE}/${model}:generateContent?key=${request.apiKey}`;

    console.log('🌟 Gemini API Request Details:');
    console.log('📍 URL:', url);
    console.log('🤖 Model:', model);
    console.log(
      '🔑 API Key preview:',
      `${request.apiKey?.substring(0, 10)}...`,
    );
    console.log(
      '📝 Prompt preview:',
      `${request.prompt?.substring(0, 100)}...`,
    );

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: request.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: request.temperature || this.getDefaultTemperature(),
        maxOutputTokens: request.maxTokens || 150,
        candidateCount: 1,
        stopSequences: [],
        // 🔧 UNIVERSAL FIX: Force JSON mode for Gemini
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            story_text: {
              type: 'string',
              description: 'The themed story text with emoji',
            },
            emoji: {
              type: 'string',
              description: 'Single emoji that captures the essence',
            },
            plain_text: {
              type: 'string',
              description: 'Professional version without theme elements',
            },
          },
          required: ['story_text', 'emoji', 'plain_text'],
        },
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

    try {
      console.log('🚀 Making Gemini API request...');
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const duration = Date.now() - startTime;
      console.log(
        `⏱️ Gemini API responded in ${duration}ms with status: ${response.status}`,
      );

      if (!response.ok) {
        console.error('❌ Gemini API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url,
        });

        // Try to get error details from response
        try {
          const errorText = await response.text();
          console.error('📄 Error Response Body:', errorText);
        } catch (e) {
          console.error('❌ Could not read error response body:', e);
        }

        this.handleHttpError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response,
        );
      }

      const data = await this.safeJsonParse(response);
      console.log(
        '✅ Gemini API Success Response:',
        JSON.stringify(data, null, 2),
      );

      // Gemini specific error handling
      if (data.error) {
        if (
          data.error.code === 400 &&
          data.error.message.includes('API_KEY_INVALID')
        ) {
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Invalid Gemini API key',
            this.name,
          );
        }

        if (data.error.code === 429) {
          throw new AIGenerationError(
            AIErrorType.RATE_LIMIT_EXCEEDED,
            'Gemini API rate limit exceeded',
            this.name,
          );
        }

        throw new AIGenerationError(
          AIErrorType.UNKNOWN_ERROR,
          `Gemini API error: ${data.error.message}`,
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
   * Parse Gemini response to standard format
   */
  protected parseResponse(response: any): AIStoryResponse {
    try {
      // Gemini returns candidates array
      if (!response.candidates || response.candidates.length === 0) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No candidates in Gemini response',
          this.name,
        );
      }

      const candidate = response.candidates[0];

      if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No content in Gemini candidate',
          this.name,
        );
      }

      const { text } = candidate.content.parts[0];

      if (!text) {
        throw new AIGenerationError(
          AIErrorType.PARSING_ERROR,
          'No text in Gemini response',
          this.name,
        );
      }

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
        `Failed to parse Gemini response: ${errorMessage}`,
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
      console.log('🔑 Starting Gemini API key validation...');
      console.log('🔑 API Key preview:', `${apiKey?.substring(0, 15)}...`);
      console.log('🤖 Using model:', this.getDefaultModel());

      const testRequest: AIRequest = {
        prompt:
          'Generate a test response with JSON: {"story_text": "Test story", "emoji": "🧪", "plain_text": "Test"}',
        apiKey,
        model: this.getDefaultModel(), // 🔧 FIX: Include model in request
        maxTokens: 50,
        temperature: 0.1,
      };

      console.log('📋 Test request details:', {
        model: testRequest.model,
        maxTokens: testRequest.maxTokens,
        temperature: testRequest.temperature,
        promptLength: testRequest.prompt?.length,
      });

      await this.makeAPIRequest(testRequest);
      console.log('✅ Gemini API key validation successful!');
      return true;
    } catch (error) {
      console.error('❌ Gemini API key validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof AIGenerationError ? error.type : 'Unknown type',
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (
        error instanceof AIGenerationError &&
        error.type === AIErrorType.INVALID_API_KEY
      ) {
        console.log('🚫 Invalid API key detected');
        return false;
      }

      // Other errors might be temporary, so we'll consider the key potentially valid
      console.warn(
        '⚠️ Gemini API key validation encountered non-auth error (treating as potentially valid):',
        error,
      );
      return false; // 🔧 Changed: Return false for any error to be more strict
    }
  }

  /**
   * Extract token usage from Gemini response
   */
  protected extractTokensUsed(rawResponse: any): number | undefined {
    try {
      if (rawResponse.usageMetadata) {
        return (
          rawResponse.usageMetadata.totalTokenCount ||
          rawResponse.usageMetadata.promptTokenCount +
            rawResponse.usageMetadata.candidatesTokenCount
        );
      }
    } catch (error) {
      console.warn(
        'Could not extract token usage from Gemini response:',
        error,
      );
    }
    return undefined;
  }
}
