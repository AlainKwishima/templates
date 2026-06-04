import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/database/prisma.js";
import { AuthenticationAppError, AuthorizationAppError } from "@/shared/errors/app-error.js";
import { verifyAccessToken } from "@/utils/token.js";

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
    const token = header.slice("Bearer ".length);
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: claims.sub,
        deletedAt: null,
        status: { not: "DELETED" },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AuthenticationAppError("User not found"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((item) => item.role.name),
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
