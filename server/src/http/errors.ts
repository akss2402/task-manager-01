import type { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    });
    return;
  }

  // Avoid leaking internals; keep it consistent
  res.status(500).json({
    error: {
      message: "Internal server error"
    }
  });
}

