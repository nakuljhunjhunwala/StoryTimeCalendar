/**
 * Slack Routes - Define API endpoints for Slack integration
 */

import express from 'express';
import { SlackController } from './slack.controller';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { asyncHandler } from '@/shared/utils/async-handler.util';

const router = express.Router();

/**
 * @route   GET /api/v1/slack/oauth/initiate
 * @desc    Initiate Slack OAuth flow
 * @access  Private
 */
router.get(
  '/oauth/initiate',
  authMiddleware as any,
  asyncHandler(SlackController.initiateOAuth as any),
);

/**
 * @route   GET /api/v1/slack/oauth/callback
 * @desc    Handle Slack OAuth callback
 * @access  Public (Slack external callback)
 */
router.get(
  '/oauth/callback',
  asyncHandler(SlackController.handleOAuthCallback as any),
);

/**
 * @route   GET /api/v1/slack/integration
 * @desc    Get current Slack integration status
 * @access  Private
 */
router.get(
  '/integration',
  authMiddleware as any,
  asyncHandler(SlackController.getIntegration as any),
);

/**
 * @route   POST /api/v1/slack/test
 * @desc    Send test message to Slack
 * @access  Private
 */
router.post(
  '/test',
  authMiddleware as any,
  asyncHandler(SlackController.testMessage as any),
);

/**
 * @route   DELETE /api/v1/slack/disconnect
 * @desc    Disconnect Slack integration
 * @access  Private
 */
router.delete(
  '/disconnect',
  authMiddleware as any,
  asyncHandler(SlackController.disconnect as any),
);

export default router;
