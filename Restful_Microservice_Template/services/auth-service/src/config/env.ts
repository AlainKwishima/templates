import dotenv from "dotenv";
import { z } from "zod";

// Prefer values from this service's .env (shell env vars often override dotenv by default).
dotenv.config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
  HOST: z.string().default("0.0.0.0"),
  API_PREFIX: z.string().default("/api/v1"),
  APP_NAME: z.string().default("Auth Service"),
  APP_URL: z.string().url().default("http://localhost:4001"),
  DATABASE_URL: z.string().min(1),
  USER_SERVICE_URL: z.string().url().default("http://localhost:4002"),
  INTERNAL_SERVICE_KEY: z.string().min(16),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  JWT_ISSUER: z.string().default("enterprise-backend"),
  JWT_AUDIENCE: z.string().default("enterprise-backend-clients"),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3000")
    .transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  EMAIL_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((value) => value !== "false"),
  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_API_URL: z.string().url().default("https://api.brevo.com/v3"),
  BREVO_SENDER_EMAIL: z.string().email().optional().default("no-reply@example.com"),
  BREVO_SENDER_NAME: z.string().default("National_Examination"),
  BREVO_TEST_RECIPIENT: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
    .pipe(z.string().email().optional()),
  EMAIL_RETRY_MAX_ATTEMPTS: z.coerce.number().int().positive().max(10).default(3),
  EMAIL_RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(500),
});

export const env = envSchema.parse(process.env);
