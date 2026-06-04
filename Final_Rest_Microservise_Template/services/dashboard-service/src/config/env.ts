import { z } from 'zod';
import { loadEnv } from '@shared/lib';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3009),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  USER_SERVICE_URL: z.string().url(),
  RESOURCE_SERVICE_URL: z.string().url(),
  TRANSACTION_SERVICE_URL: z.string().url(),
  DEPARTMENT_SERVICE_URL: z.string().url(),
  DISABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
});

export const env = loadEnv('dashboard-service', schema);

