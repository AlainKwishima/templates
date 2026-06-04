import { z } from 'zod';
import { loadEnv } from '@shared/lib';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().min(1),
  JWT_REFRESH_EXPIRY: z.string().min(1),
  CLIENT_URL: z.string().min(1),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
  DISABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
});

export const env = loadEnv('auth-service', schema);

