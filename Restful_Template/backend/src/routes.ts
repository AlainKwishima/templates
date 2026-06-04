import type { Express } from "express";
import { healthRoutes } from "@/modules/health/health.routes.js";
import { authRoutes } from "@/modules/auth/auth.routes.js";
import { userRoutes } from "@/modules/users/users.routes.js";
import { uploadRoutes } from "@/modules/files/files.routes.js";
import { env } from "@/config/env.js";

export function registerRoutes(app: Express) {
  const apiPrefix = env.API_PREFIX;

  app.use(`${apiPrefix}/health`, healthRoutes);
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/files`, uploadRoutes);
}
