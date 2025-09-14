import Joi from 'joi';

// Google OAuth validation schemas
export const googleOAuthInitSchema = Joi.object({
  redirectUri: Joi.string().uri().optional(),
});

export const googleOAuthCallbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().required(),
});

// Calendar management validation schemas
export const updateCalendarSchema = Joi.object({
  isActive: Joi.boolean().optional(),
});

export const syncCalendarSchema = Joi.object({
  integrationId: Joi.string().optional(),
  calendarId: Joi.string().optional(),
});

// Manual sync validation
export const manualSyncSchema = Joi.object({
  force: Joi.boolean().default(false),
});
