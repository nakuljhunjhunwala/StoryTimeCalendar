import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware, validate } from '@/shared/middlewares';
import {
  aiSettingsSchema,
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  userProfileSchema,
} from './auth.validation';

const authRouter = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user for StoryTime Calendar
 *     description: Creates a new user account with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password (min 8 chars, must contain uppercase, lowercase, and number)
 *               name:
 *                 type: string
 *                 description: User's display name
 *               age:
 *                 type: number
 *                 minimum: 13
 *                 maximum: 120
 *                 description: User's age
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY]
 *                 description: User's gender
 *               selectedTheme:
 *                 type: string
 *                 enum: [FANTASY, GENZ, MEME]
 *                 description: Preferred story theme
 *               timezone:
 *                 type: string
 *                 description: User's timezone
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: User already exists
 */
authRouter.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user with email and password
 *     description: Logs in a user using email and password, returning access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User successfully authenticated
 *       401:
 *         description: Authentication failed
 *       400:
 *         description: Invalid request data
 */
authRouter.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Returns the current authenticated user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', authMiddleware as any, authController.getCurrentUser);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the current user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's display name
 *               age:
 *                 type: number
 *                 minimum: 13
 *                 maximum: 120
 *                 description: User's age
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY]
 *                 description: User's gender
 *               selectedTheme:
 *                 type: string
 *                 enum: [FANTASY, GENZ, MEME]
 *                 description: Preferred story theme
 *               timezone:
 *                 type: string
 *                 description: User's timezone
 *               notificationMinutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 60
 *                 description: Minutes before event to send notification
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request data
 */
authRouter.put(
  '/profile',
  authMiddleware as any,
  validate(userProfileSchema),
  authController.updateProfile,
);

/**
 * @swagger
 * /auth/ai-settings:
 *   put:
 *     summary: Update AI settings
 *     description: Updates the user's AI provider and API key settings
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aiApiKey:
 *                 type: string
 *                 description: User's AI provider API key (encrypted before storage)
 *               aiProvider:
 *                 type: string
 *                 enum: [GEMINI, OPENAI, CLAUDE, LLAMA]
 *                 description: Preferred AI provider
 *               aiModel:
 *                 type: string
 *                 description: Specific AI model to use
 *     responses:
 *       200:
 *         description: AI settings updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request data
 */
authRouter.put(
  '/ai-settings',
  authMiddleware as any,
  validate(aiSettingsSchema),
  authController.updateAISettings,
);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Changes the current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or invalid current password
 *       400:
 *         description: Invalid request data
 */
authRouter.put(
  '/change-password',
  authMiddleware as any,
  validate(changePasswordSchema),
  authController.changePassword,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     description: Logs out the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout', authMiddleware as any, authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       400:
 *         description: Invalid request data
 */
authRouter.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshAccessToken,
);

export default authRouter;
