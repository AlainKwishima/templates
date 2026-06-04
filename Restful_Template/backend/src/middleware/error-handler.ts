import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "@/shared/logger/logger.js";
import {
  AppError,
  ConflictAppError,
  DatabaseAppError,
  ValidationAppError,
} from "@/shared/errors/app-error.js";
import { errorResponse } from "@/shared/response/api-response.js";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (error instanceof ZodError) {
    const mapped = new ValidationAppError("Validation failed", error.flatten());
    return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped =
      error.code === "P2002"
        ? new ConflictAppError("Duplicate resource", error.meta)
        : new DatabaseAppError("Database request failed", error.meta);
    return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    const mapped = new ValidationAppError("Database validation failed", error.message);
    return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(errorResponse(error.message, error.code, error.details, { requestId }));
  }

  if (error instanceof Error) {
    logger.error(
      {
        err: error,
        requestId,
        path: req.originalUrl,
        method: req.method,
      },
      "Unhandled server error",
    );

    const mapped = new AppError(500, "Internal server error", "INTERNAL_SERVER_ERROR", undefined, false);
    return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, undefined, { requestId }));
  }

  const mapped = new AppError(500, "Internal server error", "INTERNAL_SERVER_ERROR", undefined, false);
  return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, undefined, { requestId }));
}
