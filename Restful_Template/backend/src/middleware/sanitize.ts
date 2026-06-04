import type { NextFunction, Request, Response } from "express";

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete record[key];
      continue;
    }

    record[key] = sanitize(record[key]) as unknown;
  }

  return record;
}

export function requestSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitize(req.body);
  }

  if (req.params && typeof req.params === "object") {
    sanitize(req.params);
  }

  if (req.query && typeof req.query === "object") {
    sanitize(req.query);
  }

  return next();
}
