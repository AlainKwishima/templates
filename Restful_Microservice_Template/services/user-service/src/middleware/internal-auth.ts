import type { NextFunction, Request, Response } from "express";
import { AuthenticationAppError } from "@restful/shared";
import { env } from "@/config/env.js";

export function requireInternalService(req: Request, _res: Response, next: NextFunction) {
  const key = req.headers["x-service-key"];
  if (typeof key !== "string" || key !== env.INTERNAL_SERVICE_KEY) {
    return next(new AuthenticationAppError("Invalid internal service credentials"));
  }
  return next();
}
