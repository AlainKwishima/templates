import { ErrorRequestHandler, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next,
): void => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors ?? []);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists.', 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'The requested record was not found.', 404);
      return;
    }
  }

  const prismaErr = err as { code?: string };
  if (prismaErr?.code === 'P2002') {
    sendError(res, 'A record with this value already exists.', 409);
    return;
  }
  if (prismaErr?.code === 'P2025') {
    sendError(res, 'The requested record was not found.', 404);
    return;
  }

  try {
    console.error('[UnhandledError]', err);
  } catch {
    // logging failed — still return 500
  }

  sendError(res, 'An unexpected error occurred.', 500);
};
