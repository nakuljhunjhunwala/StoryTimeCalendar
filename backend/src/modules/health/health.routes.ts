import { Router } from 'express';
import { HealthController } from './health.controller';

const healthRouter = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get basic health check
 *     description: Returns a simple status to indicate if the API is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 */
healthRouter.get('/', healthController.getHealth);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Get detailed health check
 *     description: Provides a detailed health status of the API and its dependencies (e.g., database).
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services are healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 details:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: UP
 *       503:
 *         description: One or more services are unhealthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: DOWN
 *                 details:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: DOWN
 *                         error:
 *                           type: string
 *                           example: Connection refused
 */
healthRouter.get('/detailed', healthController.getDetailedHealth);

export default healthRouter;
