import app from './app';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils/logger.util';
import { prismaConnector } from '@/shared/connectors/prisma.connector';
import { startJobs } from '@/jobs';

const server = app.listen(env.PORT, () => {
  logger.info(`Server is running on port ${env.PORT}`);
  startJobs();
});

const gracefulShutdown = (signal: string) => {
  process.on(signal, async () => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prismaConnector.disconnect();
      process.exit(0);
    });
  });
};

gracefulShutdown('SIGTERM');
gracefulShutdown('SIGINT');
