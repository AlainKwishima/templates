import { createHttpApp } from "@restful/service-kit";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { registerRoutes } from "@/routes.js";

export function createApp() {
  return createHttpApp({
    logger,
    corsOrigins: env.CORS_ORIGINS,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.RATE_LIMIT_MAX,
    useCookieParser: true,
    registerRoutes,
  });
}
