import type { Logger } from "pino";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { createErrorHandler } from "../middleware/error-handler.js";
import { notFoundHandler } from "../middleware/not-found.js";
import { requestContext } from "../middleware/request-context.js";
import { createRequestLogger } from "../middleware/request-logger.js";
import { requestSanitizer } from "../middleware/sanitize.js";

export interface HttpAppOptions {
  logger: Logger;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  useCookieParser?: boolean;
  registerRoutes: (app: Express) => void;
}

export function createHttpApp(options: HttpAppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(createRequestLogger(options.logger));
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigins, credentials: true }));
  app.use(hpp());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(requestSanitizer);

  if (options.useCookieParser) {
    app.use(cookieParser());
  }

  app.use(
    rateLimit({
      windowMs: options.rateLimitWindowMs,
      limit: options.rateLimitMax,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  options.registerRoutes(app);
  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logger));

  return app;
}
