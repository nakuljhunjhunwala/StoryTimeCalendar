/**
 * Notification Routes - Define API endpoints for notifications
 */

import express from 'express';
import { NotificationController } from './notification.controller';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { asyncHandler } from '@/shared/utils/async-handler.util';

const router = express.Router();

/**
 * @route   GET /api/v1/notifications/stats
 * @desc    Get user's notification statistics
 * @access  Private
 */
router.get(
  '/stats',
  authMiddleware as any,
  asyncHandler(NotificationController.getStats as any),
);

/**
 * @route   GET /api/v1/notifications/recent
 * @desc    Get user's recent notifications
 * @access  Private
 */
router.get(
  '/recent',
  authMiddleware as any,
  asyncHandler(NotificationController.getRecentNotifications as any),
);

/**
 * @route   POST /api/v1/notifications/trigger/:eventId
 * @desc    Manually trigger notification for an event
 * @access  Private
 */
router.post(
  '/trigger/:eventId',
  authMiddleware as any,
  asyncHandler(NotificationController.triggerNotification as any),
);

/**
 * @route   GET /api/v1/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get(
  '/preferences',
  authMiddleware as any,
  asyncHandler(NotificationController.getPreferences as any),
);

/**
 * @route   PUT /api/v1/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put(
  '/preferences',
  authMiddleware as any,
  asyncHandler(NotificationController.updatePreferences as any),
);

export default router;
