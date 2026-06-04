import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

import { env } from "@/config/env.js";
import { buildSwaggerSpec, swaggerHandler, swaggerMiddleware } from "@/docs/swagger.js";
import { errorHandler } from "@/middleware/error-handler.js";
import { notFoundHandler } from "@/middleware/not-found.js";
import { requestContext } from "@/middleware/request-context.js";
import { requestSanitizer } from "@/middleware/sanitize.js";
import { requestLogger } from "@/shared/logger/request-logger.js";
import { registerRoutes } from "@/routes.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(hpp());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(requestSanitizer);
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  buildSwaggerSpec();
  app.use("/docs", swaggerMiddleware, swaggerHandler());

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
