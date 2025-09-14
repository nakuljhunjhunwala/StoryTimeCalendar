import { Request, Response } from 'express';
import { asyncHandler, logger, ResponseUtil } from '@/shared/utils';
import { prismaConnector } from '@/shared/connectors/prisma.connector';

export class HealthController {
  /**
   * Basic health check for StoryTime Calendar
   */
  public getHealth = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Health check requested');
    ResponseUtil.success(
      res,
      {
        status: 'UP',
        service: 'storytime-calendar',
        timestamp: new Date().toISOString(),
      },
      'StoryTime Calendar API is healthy',
    );
  });

  /**
   * Detailed health check with database and system status
   */
  public getDetailedHealth = asyncHandler(
    async (req: Request, res: Response) => {
      logger.info('Detailed health check requested');

      const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'storytime-calendar',
        version: '1.0.0',
        details: {
          database: {
            status: 'UP',
          } as any,
          server: {
            status: 'UP',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
          },
        },
      };

      try {
        // Check database connection
        const isDbHealthy = await prismaConnector.healthCheck();
        if (!isDbHealthy) {
          health.status = 'DOWN';
          health.details.database = { status: 'DOWN' } as any;
          logger.error('Database health check failed');
          ResponseUtil.error(res, 'Database connection failed', 503, health);
          return;
        }

        // Get database info for detailed health
        try {
          const dbInfo = await prismaConnector.getDatabaseInfo();
          health.details.database = {
            status: 'UP',
            version: dbInfo.version.split(' ')[0], // Clean up version string
            connections: dbInfo.connections,
            uptime: Math.floor(dbInfo.uptime),
          } as any;
        } catch (dbInfoError) {
          // Basic connection works but detailed info failed
          health.details.database = {
            status: 'UP',
            note: 'Connected but unable to fetch detailed info',
          } as any;
          logger.warn(
            'Database connected but detailed info unavailable:',
            dbInfoError,
          );
        }

        ResponseUtil.success(res, health, 'All services are healthy');
      } catch (error) {
        logger.error('Detailed health check failed:', error);
        health.status = 'DOWN';
        health.details.database = {
          status: 'DOWN',
          error: error instanceof Error ? error.message : 'Unknown error',
        } as any;

        ResponseUtil.error(
          res,
          'One or more services are unhealthy',
          503,
          health,
        );
      }
    },
  ) as any;
}
