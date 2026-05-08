import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./errors.js";

declare global {
  // eslint-disable-next-line no-var
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

function makeValidationError(issues: unknown) {
  return new HttpError(400, "Validation error", {
    code: "VALIDATION_ERROR",
    details: issues
  });
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(makeValidationError(parsed.error.issues));
      return;
    }
    req.body = parsed.data;
    req.validated = { ...(req.validated ?? {}), body: parsed.data };
    next();
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(makeValidationError(parsed.error.issues));
      return;
    }
    // Express 5: req.query can be getter-only; don't mutate it.
    req.validated = { ...(req.validated ?? {}), query: parsed.data };
    next();
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(makeValidationError(parsed.error.issues));
      return;
    }
    // Express 5: req.params can be getter-only; don't mutate it.
    req.validated = { ...(req.validated ?? {}), params: parsed.data };
    next();
  };
}

