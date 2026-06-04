import { z } from 'zod';
import { loadEnv } from '@shared/lib';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3007),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),
  CLIENT_URL: z.string().min(1),
  DISABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
});

export const env = loadEnv('notification-service', schema);

