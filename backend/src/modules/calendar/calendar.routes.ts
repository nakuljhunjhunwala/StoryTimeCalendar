import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { authMiddleware, validate } from '@/shared/middlewares';
import {
  googleOAuthInitSchema,
  manualSyncSchema,
  updateCalendarSchema,
} from './calendar.validation';

const calendarRouter = Router();
const calendarController = new CalendarController();

/**
 * @swagger
 * /calendar/auth/google/init:
 *   post:
 *     summary: Initiate Google Calendar OAuth flow
 *     description: Generates Google OAuth authorization URL for calendar access
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               redirectUri:
 *                 type: string
 *                 format: uri
 *                 description: Custom redirect URI (optional)
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                   description: Google OAuth authorization URL
 *                 state:
 *                   type: string
 *                   description: OAuth state parameter for security
 *       401:
 *         description: Unauthorized
 */
calendarRouter.post(
  '/auth/google/init',
  authMiddleware as any,
  validate(googleOAuthInitSchema),
  calendarController.initiateGoogleOAuth,
);

/**
 * @swagger
 * /calendar/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     description: Processes Google OAuth callback and creates calendar integration
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth state parameter
 *     responses:
 *       201:
 *         description: Calendar integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 integrationId:
 *                   type: string
 *                   description: Created integration ID
 *                 calendarsFound:
 *                   type: number
 *                   description: Number of calendars discovered
 *       400:
 *         description: Invalid callback parameters
 */
calendarRouter.get(
  '/auth/google/callback',
  calendarController.handleGoogleCallback,
);

/**
 * @swagger
 * /calendar/integrations:
 *   get:
 *     summary: Get user's calendar integrations
 *     description: Returns all calendar integrations for the authenticated user
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   provider:
 *                     type: string
 *                     enum: [GOOGLE, MICROSOFT, OUTLOOK, APPLE, CALDAV]
 *                   status:
 *                     type: string
 *                     enum: [ACTIVE, INACTIVE, ERROR, EXPIRED]
 *                   lastSyncAt:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
calendarRouter.get(
  '/integrations',
  authMiddleware as any,
  calendarController.getIntegrations,
);

/**
 * @swagger
 * /calendar/calendars:
 *   get:
 *     summary: Get user's calendars
 *     description: Returns all calendars from connected integrations
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendars retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   providerCalendarId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   isPrimary:
 *                     type: boolean
 *                   isActive:
 *                     type: boolean
 *                   lastSyncAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
calendarRouter.get(
  '/calendars',
  authMiddleware as any,
  calendarController.getCalendars,
);

/**
 * @swagger
 * /calendar/calendars/{calendarId}:
 *   put:
 *     summary: Update calendar settings
 *     description: Enable or disable calendar for syncing
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         required: true
 *         schema:
 *           type: string
 *         description: Calendar ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Enable or disable calendar syncing
 *             required:
 *               - isActive
 *     responses:
 *       200:
 *         description: Calendar updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Calendar not found
 */
calendarRouter.put(
  '/calendars/:calendarId',
  authMiddleware as any,
  validate(updateCalendarSchema),
  calendarController.updateCalendar,
);

/**
 * @swagger
 * /calendar/integrations/{integrationId}:
 *   delete:
 *     summary: Disconnect calendar integration
 *     description: Removes calendar integration and all associated data
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration ID
 *     responses:
 *       200:
 *         description: Integration disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration not found
 */
calendarRouter.delete(
  '/integrations/:integrationId',
  authMiddleware as any,
  calendarController.deleteIntegration,
);

/**
 * @swagger
 * /calendar/sync:
 *   post:
 *     summary: Manual calendar sync
 *     description: Triggers manual synchronization of calendar events
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force sync even if recent sync exists
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   integrationId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [success, error, in_progress]
 *                   lastSyncAt:
 *                     type: string
 *                     format: date-time
 *                   eventsProcessed:
 *                     type: number
 *                   error:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
calendarRouter.post(
  '/sync',
  authMiddleware as any,
  validate(manualSyncSchema),
  calendarController.syncEvents,
);

/**
 * @swagger
 * /calendar/events:
 *   get:
 *     summary: Get user's upcoming events
 *     description: Returns upcoming events from synchronized calendars
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   providerEventId:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                   isAllDay:
 *                     type: boolean
 *                   location:
 *                     type: string
 *                   meetingLink:
 *                     type: string
 *                   attendeeCount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   storyline:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       theme:
 *                         type: string
 *                       storyText:
 *                         type: string
 *                       plainText:
 *                         type: string
 *                       emoji:
 *                         type: string
 *                       aiProvider:
 *                         type: string
 *                       tokensUsed:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                       hasStoryline:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
calendarRouter.get(
  '/events',
  authMiddleware as any,
  calendarController.getEvents,
);

/**
 * @swagger
 * /calendar/events/{eventId}/storyline:
 *   post:
 *     summary: Generate storyline for an event
 *     description: Generate or regenerate AI storyline for a specific event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [FANTASY, GENZ, MEME]
 *                 description: Story theme (defaults to user preference)
 *               forceRegenerate:
 *                 type: boolean
 *                 description: Force regeneration even if storyline exists
 *     responses:
 *       200:
 *         description: Storyline generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 storyline:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     theme:
 *                       type: string
 *                     storyText:
 *                       type: string
 *                     plainText:
 *                       type: string
 *                     emoji:
 *                       type: string
 *                     aiProvider:
 *                       type: string
 *                     tokensUsed:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 */
calendarRouter.post(
  '/events/:eventId/storyline',
  authMiddleware as any,
  calendarController.generateStoryline,
);

/**
 * @swagger
 * /calendar/sync/status:
 *   get:
 *     summary: Get sync status
 *     description: Returns current synchronization status for all integrations
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIntegrations:
 *                   type: number
 *                 activeIntegrations:
 *                   type: number
 *                 lastSyncAt:
 *                   type: string
 *                   format: date-time
 *                 integrations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       status:
 *                         type: string
 *                       lastSyncAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
calendarRouter.get(
  '/sync/status',
  authMiddleware as any,
  calendarController.getSyncStatus,
);

export default calendarRouter;
