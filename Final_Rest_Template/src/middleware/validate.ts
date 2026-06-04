import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

type ValidationTarget = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export const validate = (schemas: ValidationTarget | ZodSchema) => {
  const targets: ValidationTarget =
    'safeParse' in schemas ? { body: schemas as ZodSchema } : (schemas as ValidationTarget);

  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    if (targets.body) {
      const result = targets.body.safeParse(req.body);
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push({ field: e.path.join('.'), message: e.message }),
        );
      } else {
        req.body = result.data;
      }
    }

    if (targets.params) {
      const result = targets.params.safeParse(req.params);
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push({ field: e.path.join('.'), message: e.message }),
        );
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (targets.query) {
      const result = targets.query.safeParse(req.query);
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push({ field: e.path.join('.'), message: e.message }),
        );
      } else {
        req.query = result.data as typeof req.query;
      }
    }

    if (errors.length > 0) {
      sendError(res, 'Validation failed', 400, errors);
      return;
    }

    next();
  };
};
