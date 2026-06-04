import type { Express } from "express";
import { env } from "@/config/env.js";
import { healthRoutes } from "@/modules/health/health.routes.js";
import { userRoutes } from "@/modules/users/users.routes.js";
import { internalRoutes } from "@/modules/internal/internal.routes.js";

export function registerRoutes(app: Express) {
  const apiPrefix = env.API_PREFIX;

  app.use(`${apiPrefix}/health`, healthRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use("/internal/users", internalRoutes);
}
