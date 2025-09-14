import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5004),
  SERVER_URL: z.string().default('http://localhost:5004'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string().default('30d'),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string().default('90d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // Slack Integration
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_REDIRECT_URI: z.string().optional(),

  // Frontend URL
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Encryption for API keys
  ENCRYPTION_KEY: z.string().length(64), // 32-byte hex key

  // DataDog (Optional)
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_HOST: z.string().optional(),
  DATADOG_SERVICE: z.string().optional(),
  DATADOG_REGION: z.string().optional(),

  // Logging
  LOG_LEVEL: z.string().default('info'),

  // Service
  SERVICE_NAME: z.string().default('storytime-calendar'),
});

export const env = envSchema.parse(process.env);
