/**
 * Abstract Base AI Provider
 */

import { AIProvider } from '@prisma/client';
import {
  AIErrorType,
  AIGenerationError,
  AIRequest,
  AIResponse,
  AIStoryResponse,
  IAIProvider,
  StoryContext,
} from '@/shared/types/ai.types';
import { EXTERNAL_APIS } from '@/shared/constants/app.constants';

export abstract class BaseAIProvider implements IAIProvider {
  abstract name: AIProvider;
  abstract getDefaultModel(): string;
  abstract getSupportedModels(): string[];
  abstract getMaxTokens(): number;
  abstract getDefaultTemperature(): number;

  // Abstract methods that each provider must implement
  protected abstract makeAPIRequest(request: AIRequest): Promise<any>;
  protected abstract parseResponse(response: any): AIStoryResponse;
  protected abstract validateApiKeyImpl(apiKey: string): Promise<boolean>;

  /**
   * Generate story using the specific AI provider
   */
  async generateStory(
    request: AIRequest,
    context: StoryContext,
  ): Promise<AIResponse> {
    try {
      // Validate inputs
      this.validateRequest(request);

      // Make API request to the specific provider
      const rawResponse = await this.makeAPIRequest(request);

      // Parse the response into standardized format
      const parsedResponse = this.parseResponse(rawResponse);

      // Validate the parsed response
      this.validateParsedResponse(parsedResponse);

      // Return standardized response
      return {
        storyText: parsedResponse.story_text,
        emoji: parsedResponse.emoji,
        plainText: parsedResponse.plain_text,
        tokensUsed: this.extractTokensUsed(rawResponse),
        model: request.model || this.getDefaultModel(),
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }

      // Convert unknown errors to AIGenerationError
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new AIGenerationError(
        AIErrorType.UNKNOWN_ERROR,
        `Failed to generate story: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      return await this.validateApiKeyImpl(apiKey);
    } catch (error) {
      console.error(`API key validation failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Validate the request object
   */
  protected validateRequest(request: AIRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new AIGenerationError(
        AIErrorType.INVALID_REQUEST,
        'Prompt cannot be empty',
        this.name,
      );
    }

    if (!request.apiKey || request.apiKey.trim().length === 0) {
      throw new AIGenerationError(
        AIErrorType.INVALID_API_KEY,
        'API key is required',
        this.name,
      );
    }

    if (
      request.maxTokens &&
      (request.maxTokens < 1 || request.maxTokens > this.getMaxTokens())
    ) {
      throw new AIGenerationError(
        AIErrorType.INVALID_REQUEST,
        `maxTokens must be between 1 and ${this.getMaxTokens()}`,
        this.name,
      );
    }

    if (
      request.temperature &&
      (request.temperature < 0 || request.temperature > 2)
    ) {
      throw new AIGenerationError(
        AIErrorType.INVALID_REQUEST,
        'temperature must be between 0 and 2',
        this.name,
      );
    }
  }

  /**
   * Validate the parsed response from AI
   */
  protected validateParsedResponse(response: AIStoryResponse): void {
    if (!response.story_text || response.story_text.trim().length === 0) {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        'AI response missing story_text',
        this.name,
      );
    }

    if (!response.emoji || response.emoji.trim().length === 0) {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        'AI response missing emoji',
        this.name,
      );
    }

    if (!response.plain_text || response.plain_text.trim().length === 0) {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        'AI response missing plain_text',
        this.name,
      );
    }

    // Check story text length (should be 2-3 lines, roughly 100-300 characters)
    console.log('🔍 Validating story text length:', {
      length: response.story_text.length,
      text: response.story_text,
      isValid:
        response.story_text.length >= 30 && response.story_text.length <= 800,
    });

    if (response.story_text.length < 30 || response.story_text.length > 800) {
      console.error('❌ Story text length validation failed:', {
        actualLength: response.story_text.length,
        expectedRange: '30-800 characters',
        storyText: response.story_text,
      });
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        `Story text length is outside expected range (30-800 characters). Got ${response.story_text.length} characters: "${response.story_text}"`,
        this.name,
      );
    }

    console.log('✅ Story text length validation passed');
  }

  /**
   * Extract tokens used from raw response (provider-specific implementation)
   */
  protected extractTokensUsed(rawResponse: any): number | undefined {
    // Default implementation - providers should override if they provide token usage
    return undefined;
  }

  /**
   * 🔧 UNIVERSAL JSON PARSER - Handles all provider response formats
   */
  protected parseJsonResponse(text: string): any {
    if (!text || typeof text !== 'string') {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        'Empty or invalid response text',
        this.name,
      );
    }

    console.log(`🔍 [${this.name}] Raw response text:`, text);

    // Step 1: Clean the text (remove common wrappers)
    let cleanedText = text.trim();

    // Remove markdown code block wrappers (```json...``` or ```...```)
    if (cleanedText.includes('```')) {
      console.log(`🧹 [${this.name}] Removing markdown wrappers...`);
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/gm, ''); // Remove opening
      cleanedText = cleanedText.replace(/\s*```\s*$/gm, ''); // Remove closing
      cleanedText = cleanedText.trim();
      console.log(`🧹 [${this.name}] Cleaned text:`, cleanedText);
    }

    // Handle provider-specific prefixes/suffixes
    if (
      cleanedText.includes('Here is the JSON:') ||
      cleanedText.includes('JSON response:')
    ) {
      console.log(`🧹 [${this.name}] Removing instruction prefixes...`);
      cleanedText = cleanedText.replace(
        /.*(?:Here is the JSON|JSON response):\s*/i,
        '',
      );
      cleanedText = cleanedText.trim();
    }

    // Step 2: Attempt direct JSON parsing
    try {
      console.log(`🔍 [${this.name}] Attempting direct JSON parse...`);
      const parsed = JSON.parse(cleanedText);
      console.log(`✅ [${this.name}] Direct JSON parse successful:`, parsed);
      return parsed;
    } catch (directError) {
      console.warn(`⚠️ [${this.name}] Direct JSON parse failed:`, directError);

      // Step 3: Try to extract JSON from mixed content
      console.log(
        `🔍 [${this.name}] Attempting JSON extraction from mixed content...`,
      );

      // Look for JSON object patterns
      const jsonPatterns = [
        /\{[\s\S]*\}/g, // Any content between { and }
        /\{[^}]*"story_text"[^}]*\}/g, // Specific to our expected format
      ];

      for (const pattern of jsonPatterns) {
        const matches = cleanedText.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              console.log(`🔍 [${this.name}] Testing JSON candidate:`, match);
              const parsed = JSON.parse(match.trim());

              // Validate it has our expected structure
              if (
                parsed &&
                typeof parsed === 'object' &&
                (parsed.story_text || parsed.content || parsed.text)
              ) {
                console.log(
                  `✅ [${this.name}] JSON extraction successful:`,
                  parsed,
                );
                return parsed;
              }
            } catch (matchError) {
              console.warn(
                `⚠️ [${this.name}] JSON candidate failed:`,
                matchError,
              );
              continue;
            }
          }
        }
      }

      // Step 4: Last resort - try to construct JSON from structured text
      console.log(`🔍 [${this.name}] Attempting structured text parsing...`);
      return this.parseStructuredText(cleanedText);
    }
  }

  /**
   * Parse structured text as fallback (looks for key-value patterns)
   */
  private parseStructuredText(text: string): any {
    console.log(`🔍 [${this.name}] Parsing structured text:`, text);

    // Common patterns to look for
    const patterns = {
      story_text: [
        /(?:story_text|story|text)[\s:=]+['""]([^'""]+)['""]?/i,
        /(?:story_text|story|text)[\s:=]+([^\n\r,}]+)/i,
      ],
      emoji: [
        /(?:emoji)[\s:=]+['""]([^'""]+)['""]?/i,
        /(?:emoji)[\s:=]+([^\s\n\r,}]+)/i,
      ],
      plain_text: [
        /(?:plain_text|plain)[\s:=]+['""]([^'""]+)['""]?/i,
        /(?:plain_text|plain)[\s:=]+([^\n\r,}]+)/i,
      ],
    };

    const result: any = {};

    for (const [key, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = text.match(regex);
        if (match && match[1]) {
          result[key] = match[1].trim();
          console.log(`✅ [${this.name}] Found ${key}:`, result[key]);
          break;
        }
      }
    }

    // Validate we got the essential fields
    if (!result.story_text) {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        `Could not extract story text from response. Raw text: ${text}`,
        this.name,
      );
    }

    // Provide defaults for missing fields
    if (!result.emoji) {
      result.emoji = '📅'; // Default emoji
      console.log(`⚠️ [${this.name}] Using default emoji`);
    }

    if (!result.plain_text) {
      result.plain_text = result.story_text.replace(/[^\w\s.,!?-]/g, '').trim();
      console.log(`⚠️ [${this.name}] Generated plain_text from story_text`);
    }

    console.log(`✅ [${this.name}] Structured parsing result:`, result);
    return result;
  }

  /**
   * Handle common HTTP errors
   */
  protected handleHttpError(error: any, response?: Response): never {
    if (response) {
      switch (response.status) {
        case 401:
          throw new AIGenerationError(
            AIErrorType.INVALID_API_KEY,
            'Invalid API key',
            this.name,
            error,
          );
        case 429:
          throw new AIGenerationError(
            AIErrorType.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded',
            this.name,
            error,
          );
        case 403:
          throw new AIGenerationError(
            AIErrorType.QUOTA_EXCEEDED,
            'API quota exceeded',
            this.name,
            error,
          );
        case 400:
          throw new AIGenerationError(
            AIErrorType.INVALID_REQUEST,
            'Invalid request format',
            this.name,
            error,
          );
        default:
          throw new AIGenerationError(
            AIErrorType.NETWORK_ERROR,
            `HTTP ${response.status}: ${response.statusText}`,
            this.name,
            error,
          );
      }
    }

    // Network or other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new AIGenerationError(
        AIErrorType.NETWORK_ERROR,
        'Network connection failed',
        this.name,
        error,
      );
    }

    throw new AIGenerationError(
      AIErrorType.UNKNOWN_ERROR,
      error.message || 'Unknown error occurred',
      this.name,
      error,
    );
  }

  /**
   * Safely parse JSON response
   */
  protected async safeJsonParse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch (error) {
      throw new AIGenerationError(
        AIErrorType.PARSING_ERROR,
        'Failed to parse JSON response',
        this.name,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
