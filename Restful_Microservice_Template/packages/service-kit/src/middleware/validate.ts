import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

function parseAndAssign(
  req: Request,
  next: NextFunction,
  getter: () => unknown,
  setter: (value: unknown) => void,
  schema: ZodTypeAny,
) {
  try {
    setter(schema.parse(getter()));
    next();
  } catch (error) {
    next(error instanceof ZodError ? error : new Error("Validation failed"));
  }
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) =>
    parseAndAssign(req, next, () => req.body, (value) => {
      req.body = value;
    }, schema);
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) =>
    parseAndAssign(
      req,
      next,
      () => req.query,
      (value) => {
        const parsed = value as Record<string, unknown>;
        for (const key of Object.keys(req.query as Record<string, unknown>)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query as Record<string, unknown>, parsed);
      },
      schema,
    );
}

export function validateParams<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) =>
    parseAndAssign(req, next, () => req.params, (value) => {
      req.params = value as typeof req.params;
    }, schema);
}
