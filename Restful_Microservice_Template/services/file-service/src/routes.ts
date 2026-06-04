import type { Express } from "express";
import { env } from "@/config/env.js";
import { healthRoutes } from "@/modules/health/health.routes.js";
import { uploadRoutes } from "@/modules/files/files.routes.js";

export function registerRoutes(app: Express) {
  const apiPrefix = env.API_PREFIX;

  app.use(`${apiPrefix}/health`, healthRoutes);
  app.use(`${apiPrefix}/files`, uploadRoutes);
}
