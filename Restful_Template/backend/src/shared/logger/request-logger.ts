import { logger } from "@/config/logger.js";
import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  logger.info(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    },
    "Request started",
  );

  res.on("finish", () => {
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      "Request completed",
    );
  });

  next();
}
