import { z } from 'zod';
import { loadEnv } from '@shared/lib';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AUTH_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  ROLE_SERVICE_URL: z.string().url(),
  DEPARTMENT_SERVICE_URL: z.string().url(),
  RESOURCE_SERVICE_URL: z.string().url(),
  TRANSACTION_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  REPORT_SERVICE_URL: z.string().url(),
  DASHBOARD_SERVICE_URL: z.string().url(),
  PUBLIC_GATEWAY_URL: z.string().url().default('http://localhost:3000'),
  DISABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
});

export const env = loadEnv('api-gateway', schema);

