import type { Request, Response } from "express";
import { NotFoundAppError } from "@/shared/errors/app-error.js";
import { errorResponse } from "@/shared/response/api-response.js";

export function notFoundHandler(req: Request, res: Response) {
  const error = new NotFoundAppError(`Route ${req.method} ${req.originalUrl} not found`);
  res.status(error.statusCode).json(errorResponse(error.message, error.code));
}
