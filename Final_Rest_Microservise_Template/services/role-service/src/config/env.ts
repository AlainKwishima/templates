import { z } from 'zod';
import { loadEnv } from '@shared/lib';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3003),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  DISABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
});

export const env = loadEnv('role-service', schema);

