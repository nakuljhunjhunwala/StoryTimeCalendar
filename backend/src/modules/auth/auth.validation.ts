import Joi from 'joi';

// StoryTime Calendar Authentication Validation

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    }),
  name: Joi.string().max(100).optional(),
  age: Joi.number().integer().min(13).max(120).optional(),
  gender: Joi.string()
    .valid('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY')
    .optional(),
  selectedTheme: Joi.string().valid('FANTASY', 'GENZ', 'MEME').optional(),
  timezone: Joi.string().optional(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    }),
});

export const userProfileSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  age: Joi.number().integer().min(13).max(120).optional(),
  gender: Joi.string()
    .valid('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY')
    .optional(),
  selectedTheme: Joi.string().valid('FANTASY', 'GENZ', 'MEME').optional(),
  timezone: Joi.string().optional(),
  notificationMinutes: Joi.number().integer().min(1).max(60).optional(),
});

export const aiSettingsSchema = Joi.object({
  aiApiKey: Joi.string().min(10).max(500).optional(),
  aiProvider: Joi.string()
    .valid('GEMINI', 'OPENAI', 'CLAUDE', 'LLAMA')
    .optional(),
  aiModel: Joi.string().max(50).optional(),
});
