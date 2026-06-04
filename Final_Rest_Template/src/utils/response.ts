import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...meta,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number,
  errors: unknown[] = [],
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
