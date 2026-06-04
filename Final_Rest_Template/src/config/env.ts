import { z } from 'zod';

// ---------------------------------------------------------------------------
// Environment variable schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // ── Server ────────────────────────────────────────────────────────────────
  PORT: z
    .string()
    .min(1, 'PORT is required')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'PORT must be a valid port number (1–65535)',
    }),

  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({
      message: 'NODE_ENV must be one of: development, production, test',
    }),
  }),

  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid connection URL'),

  // ── JWT Authentication ────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET is required'),

  JWT_ACCESS_EXPIRY: z
    .string()
    .min(1, 'JWT_ACCESS_EXPIRY is required')
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_EXPIRY must be a duration string (e.g. 15m, 1h, 7d)'),

  JWT_REFRESH_EXPIRY: z
    .string()
    .min(1, 'JWT_REFRESH_EXPIRY is required')
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRY must be a duration string (e.g. 15m, 1h, 7d)'),

  // ── Brevo Email Service ───────────────────────────────────────────────────
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),

  BREVO_SENDER_EMAIL: z
    .string()
    .email('BREVO_SENDER_EMAIL must be a valid email address'),

  BREVO_SENDER_NAME: z.string().min(1, 'BREVO_SENDER_NAME is required'),

  // ── Swagger / API Documentation ───────────────────────────────────────────
  DISABLE_SWAGGER: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// ---------------------------------------------------------------------------
// Parse and validate
// ---------------------------------------------------------------------------

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formatted = result.error.errors
    .map((err) => `  • ${err.path.join('.')}: ${err.message}`)
    .join('\n');

  console.error(
    `\n[env] ❌  Environment validation failed. The following variables are missing or invalid:\n\n${formatted}\n\n` +
      `  Copy .env.example to .env and fill in the required values.\n`,
  );

  process.exit(1);
}

// ---------------------------------------------------------------------------
// Typed export
// ---------------------------------------------------------------------------

/**
 * Validated, typed environment configuration.
 *
 * Import this object instead of accessing `process.env` directly so that
 * TypeScript can enforce correct usage throughout the codebase.
 *
 * @example
 * import { env } from './config/env';
 * const port = env.PORT; // number
 */
export const env = result.data;

export type Env = typeof env;
