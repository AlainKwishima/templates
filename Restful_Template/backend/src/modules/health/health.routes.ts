import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler.js";
import { healthCheck, livenessCheck, readinessCheck } from "@/modules/health/health.controller.js";

export const healthRoutes = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Full health check
 *     responses:
 *       200:
 *         description: OK
 */
healthRoutes.get("/", asyncHandler(healthCheck));
healthRoutes.get("/live", asyncHandler(livenessCheck));
healthRoutes.get("/ready", asyncHandler(readinessCheck));
