import type { Request, Response } from "express";
import { prisma } from "@/database/prisma.js";
import { successResponse } from "@/shared/response/api-response.js";

export async function healthCheck(req: Request, res: Response) {
  const payload = {
    status: "ok",
    requestId: req.requestId,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  res.json(successResponse("Health check passed", payload, { requestId: req.requestId }));
}

export async function livenessCheck(req: Request, res: Response) {
  res.json(successResponse("Service is alive", { alive: true }, { requestId: req.requestId }));
}

export async function readinessCheck(req: Request, res: Response) {
  await prisma.$queryRaw`SELECT 1`;
  res.json(successResponse("Service is ready", { ready: true }, { requestId: req.requestId }));
}
