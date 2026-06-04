import type { Request, Response } from "express";
import { NotFoundAppError, errorResponse } from "@restful/shared";

export function notFoundHandler(req: Request, res: Response) {
  const error = new NotFoundAppError(`Route ${req.method} ${req.originalUrl} not found`);
  res.status(error.statusCode).json(errorResponse(error.message, error.code, undefined, { requestId: req.requestId }));
}
