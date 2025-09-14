/**
 * AI Validation - Validate AI-related requests
 */

import Joi from 'joi';
import { AIProvider, Theme } from '@prisma/client';

// Supported AI providers (excluding unsupported ones like LLAMA)
const SUPPORTED_PROVIDERS = [
  AIProvider.GEMINI,
  AIProvider.OPENAI,
  AIProvider.CLAUDE,
];

export const aiValidation = {
  /**
   * Validate AI settings update request
   */
  updateSettings: Joi.object({
    aiProvider: Joi.string()
      .valid(...SUPPORTED_PROVIDERS)
      .optional()
      .messages({
        'any.only': `AI provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`,
      }),

    aiApiKey: Joi.string().min(10).max(200).optional().messages({
      'string.min': 'API key must be at least 10 characters long',
      'string.max': 'API key cannot exceed 200 characters',
    }),

    aiModel: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'AI model name must be at least 3 characters long',
      'string.max': 'AI model name cannot exceed 100 characters',
    }),
  })
    .or('aiProvider', 'aiApiKey', 'aiModel')
    .messages({
      'object.missing':
        'At least one field (aiProvider, aiApiKey, or aiModel) must be provided',
    }),

  /**
   * Validate API key validation request
   */
  validateApiKey: Joi.object({
    provider: Joi.string()
      .valid(...SUPPORTED_PROVIDERS)
      .required()
      .messages({
        'any.required': 'AI provider is required',
        'any.only': `AI provider must be one of: ${SUPPORTED_PROVIDERS.join(', ')}`,
      }),

    apiKey: Joi.string().min(10).max(200).required().messages({
      'any.required': 'API key is required',
      'string.min': 'API key must be at least 10 characters long',
      'string.max': 'API key cannot exceed 200 characters',
    }),

    model: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'Model name must be at least 3 characters long',
      'string.max': 'Model name cannot exceed 100 characters',
    }),
  }),

  /**
   * Validate single storyline generation request
   */
  generateStoryline: Joi.object({
    theme: Joi.string()
      .valid(...Object.values(Theme))
      .optional()
      .messages({
        'any.only': `Theme must be one of: ${Object.values(Theme).join(', ')}`,
      }),

    forceRegenerate: Joi.boolean().optional().default(false),

    includeContext: Joi.boolean().optional().default(true),
  }),

  /**
   * Validate multiple storylines generation request
   */
  generateMultiple: Joi.object({
    eventIds: Joi.array()
      .items(
        Joi.string().min(1).required().messages({
          'string.min': 'Event ID cannot be empty',
        }),
      )
      .min(1)
      .max(20)
      .required()
      .messages({
        'any.required': 'Event IDs array is required',
        'array.min': 'At least one event ID is required',
        'array.max': 'Cannot process more than 20 events at once',
      }),

    theme: Joi.string()
      .valid(...Object.values(Theme))
      .optional()
      .messages({
        'any.only': `Theme must be one of: ${Object.values(Theme).join(', ')}`,
      }),

    forceRegenerate: Joi.boolean().optional().default(false),

    includeContext: Joi.boolean().optional().default(true),
  }),

  /**
   * Validate user storylines generation request
   */
  generateUserStorylines: Joi.object({
    forceRegenerate: Joi.boolean().optional().default(false),

    includeContext: Joi.boolean().optional().default(true),
  }),

  /**
   * Validate event ID parameter
   */
  eventIdParam: Joi.object({
    eventId: Joi.string().min(1).required().messages({
      'any.required': 'Event ID is required',
      'string.min': 'Event ID cannot be empty',
    }),
  }),
};
