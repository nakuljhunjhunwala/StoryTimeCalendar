import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from '@/shared/config/env.config';
import { ApiError } from '@/shared/utils';
import { StatusCodes } from '@/shared/constants';
import {
  handleError,
  handlePrismaError,
  handleValidationError,
  morganMiddleware,
  requestIdMiddleware,
} from '@/shared/middlewares';
import v1Router from '@/routes';
import { setupSwagger } from '@/shared/config/swagger.config';
import { initializePassport, passport } from '@/shared/config/passport.config';
import httpContext from 'express-http-context';

const app: Application = express();

// Swagger
setupSwagger(app);

// Initialize Passport for OAuth
initializePassport();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
// app.use(helmet());
app.use(compression());

// Passport middleware
app.use(passport.initialize());

// Http context
app.use(httpContext.middleware);

// Add request ID to each request
app.use(requestIdMiddleware);

// Set request ID in http context
app.use((req, res, next) => {
  httpContext.set('requestId', req.id);
  next();
});

// Request logger
if (env.NODE_ENV !== 'test') {
  app.use(morganMiddleware);
}

// Rate limiting removed for development (as specified in FRD Sub-phase 1A.4)
// Production deployments should implement appropriate rate limiting

// Routes
app.get('/', (req, res) => {
  res.send('Hello World');
});
app.use('/api/v1', v1Router);

// Health check
// app.get('/health', (req, res) => {
//     res.status(200).send('OK');
// });

// send back a 404 error for any unknown api request
app.use(() => {
  throw new ApiError('Not found', StatusCodes.NOT_FOUND);
});

// convert error to ApiError, if needed
app.use(handleValidationError);
app.use(handlePrismaError);
app.use(handleError);

export default app;
