import type { Response } from 'express';
import type { ValidationIssue } from './errors';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ?? {}),
  });

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors: ValidationIssue[] = [],
): Response =>
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errors.length > 0 ? { errors } : {}),
  });

