import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errors';
import { sendError } from './response';
import type { JwtPayload } from './types';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized - invalid or missing token', 401);
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    sendError(res, 'Unauthorized - invalid or missing token', 401);
    return;
  }

  try {
    req.user = jwt.verify(token, secret) as JwtPayload;
    next();
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError
      ? 'Unauthorized - token expired or invalid signature'
      : 'Unauthorized - token expired or invalid signature';
    sendError(res, message, 401);
  }
};

export const authorise =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized - invalid or missing token', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden - insufficient permissions', 403);
      return;
    }

    next();
  };

export const requireJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError('JWT secret is not configured', 500);
  }
  return secret;
};

