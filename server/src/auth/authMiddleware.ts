import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../http/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../db/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'admin' | 'member' };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    next(new HttpError(401, "Missing access token", { code: "MISSING_ACCESS_TOKEN" }));
    return;
  }

  try {
    const payload = verifyAccessToken(match[1]);
    
    // Fetch user role from DB
    const userRes = await pool.query<{ role: 'admin' | 'member' }>(
      'select role from users where id = $1',
      [payload.sub]
    );
    
    if (!userRes.rows[0]) {
      next(new HttpError(401, "User not found", { code: "USER_NOT_FOUND" }));
      return;
    }

    req.user = { id: payload.sub, role: userRes.rows[0].role };
    next();
  } catch {
    next(new HttpError(401, "Invalid access token", { code: "INVALID_ACCESS_TOKEN" }));
  }
}

export function requireProjectRole(projectIdParam: string, allowedRoles: Array<"admin" | "member">) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      next(new HttpError(401, "Unauthorized", { code: "UNAUTHORIZED" }));
      return;
    }
    const projectId = req.params[projectIdParam];
    if (!projectId) {
      next(new HttpError(400, `Missing project id param: ${projectIdParam}`));
      return;
    }

    const res = await pool.query<{ role: "admin" | "member" }>(
      `select role from project_members where project_id = $1 and user_id = $2 limit 1`,
      [projectId, userId]
    );
    const role = res.rows[0]?.role;
    if (!role) {
      next(new HttpError(403, "Not a project member", { code: "NOT_A_MEMBER" }));
      return;
    }
    if (!allowedRoles.includes(role)) {
      next(new HttpError(403, "Insufficient role", { code: "INSUFFICIENT_ROLE" }));
      return;
    }
    next();
  };
}

