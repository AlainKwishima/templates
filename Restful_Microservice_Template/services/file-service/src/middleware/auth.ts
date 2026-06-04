import type { NextFunction, Request, Response } from "express";
import { AuthenticationAppError, AuthorizationAppError, verifyAccessToken } from "@restful/shared";

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  sessionId?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export async function authenticateRequest(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AuthenticationAppError());
  }

  try {
    const claims = verifyAccessToken(header.slice("Bearer ".length));
    req.user = {
      id: claims.sub,
      email: claims.email,
      roles: claims.roles,
      sessionId: claims.sessionId,
    };
    return next();
  } catch {
    return next(new AuthenticationAppError("Invalid or expired token"));
  }
}

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationAppError());
  }
  return next();
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.roles.some((role) => allowedRoles.includes(role))) {
      return next(new AuthorizationAppError("Insufficient role permissions"));
    }
    return next();
  };
}
