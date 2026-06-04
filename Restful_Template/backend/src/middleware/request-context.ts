import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    authenticatedUserId?: string;
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.headers["x-request-id"]?.toString() ?? crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}

export function getRequestId(req: Request) {
  return req.requestId;
}
