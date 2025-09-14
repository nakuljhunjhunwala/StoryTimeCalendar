import Joi from 'joi';

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  profile_picture: Joi.string().uri().optional(),
  app_settings: Joi.object().optional(),
});
