/**
 * AI Routes - Handle AI-related endpoints
 */

import { Router } from 'express';
import { AIController } from './ai.controller';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { validate } from '@/shared/middlewares/validation.middleware';
import { aiValidation } from './ai.validation';

const router = Router();

// Public routes (no authentication required)
router.get('/providers', AIController.getProviders);
router.get('/models', AIController.getAllModels);
router.get('/models/:provider', AIController.getProviderModels);

// Protected routes (authentication required)
router.use(authMiddleware as any);

// User AI configuration
router.get('/config', AIController.getUserConfig);
router.put(
    '/config',
    validate(aiValidation.updateSettings),
    AIController.updateUserSettings,
);
router.delete('/config', AIController.clearUserConfig);

// API key validation
router.post(
    '/validate-key',
    validate(aiValidation.validateApiKey),
    AIController.validateApiKey,
);

// AI testing
router.post('/test', AIController.testUserSetup);

// Statistics and recommendations
router.get('/stats', AIController.getUserStats);
router.get('/recommendation', AIController.getProviderRecommendation);

// Story generation
router.post(
    '/generate/:eventId',
    validate(aiValidation.generateStoryline),
    AIController.generateStoryline,
);
router.post(
    '/generate-multiple',
    validate(aiValidation.generateMultiple),
    AIController.generateMultipleStorylines,
);
router.post(
    '/generate-all',
    validate(aiValidation.generateUserStorylines),
    AIController.generateUserStorylines,
);

export default router;
