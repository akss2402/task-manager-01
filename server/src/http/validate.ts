import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./errors.js";

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new HttpError(400, "Validation error", {
          code: "VALIDATION_ERROR",
          details: parsed.error.issues
        })
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}

