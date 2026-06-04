import type { Logger } from "pino";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  AppError,
  ConflictAppError,
  DatabaseAppError,
  ValidationAppError,
  errorResponse,
} from "@restful/shared";

function isPrismaKnownError(error: unknown): error is { code: string; meta?: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  );
}

function isPrismaValidationError(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "PrismaClientValidationError"
  );
}

export function createErrorHandler(logger: Logger) {
  return function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
    const requestId = req.requestId;

    if (error instanceof ZodError) {
      const mapped = new ValidationAppError("Validation failed", error.flatten());
      return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
    }

    if (isPrismaKnownError(error)) {
      const mapped =
        error.code === "P2002"
          ? new ConflictAppError("Duplicate resource", error.meta)
          : new DatabaseAppError("Database request failed", error.meta);
      return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
    }

    if (isPrismaValidationError(error)) {
      const mapped = new ValidationAppError("Database validation failed", error.message);
      return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, mapped.details, { requestId }));
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(errorResponse(error.message, error.code, error.details, { requestId }));
    }

    if (error instanceof Error) {
      logger.error(
        { err: error, requestId, path: req.originalUrl, method: req.method },
        "Unhandled server error",
      );
      const mapped = new AppError(500, "Internal server error", "INTERNAL_SERVER_ERROR", undefined, false);
      return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, undefined, { requestId }));
    }

    const mapped = new AppError(500, "Internal server error", "INTERNAL_SERVER_ERROR", undefined, false);
    return res.status(mapped.statusCode).json(errorResponse(mapped.message, mapped.code, undefined, { requestId }));
  };
}
