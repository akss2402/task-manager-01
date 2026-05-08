import { Router } from "express";
import { validateBody } from "../http/validate.js";
import { HttpError } from "../http/errors.js";
import { getConfig } from "../config.js";
import { requireAuth } from "./authMiddleware.js";
import * as service from "./authService.js";
import * as repo from "./authRepo.js";
import { loginSchema, signupSchema } from "./authSchemas.js";

function setRefreshCookie(res: any, refreshToken: string) {
  const { COOKIE_SECURE } = getConfig();
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/auth/refresh"
  });
}

function clearRefreshCookie(res: any) {
  const { COOKIE_SECURE } = getConfig();
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/auth/refresh"
  });
}

export const authRoutes = Router();

authRoutes.post("/signup", validateBody(signupSchema), async (req, res, next) => {
  try {
    const user = await service.signup(req.body);
    const cfg = getConfig();
    const tokens = await service.issueTokensForUser(user.id, cfg.REFRESH_TOKEN_TTL);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (e) {
    next(e);
  }
});

authRoutes.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await service.login(req.body);
    const cfg = getConfig();
    const tokens = await service.issueTokensForUser(user.id, cfg.REFRESH_TOKEN_TTL);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (e) {
    next(e);
  }
});

authRoutes.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token ?? req.body?.refreshToken;
    if (!refreshToken) throw new HttpError(401, "Missing refresh token", { code: "MISSING_REFRESH" });
    const cfg = getConfig();
    const tokens = await service.refreshTokens(refreshToken, cfg.REFRESH_TOKEN_TTL);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (e) {
    next(e);
  }
});

authRoutes.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token ?? req.body?.refreshToken;
    if (refreshToken) await service.logout(refreshToken);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

authRoutes.post("/logout-all", requireAuth, async (req, res, next) => {
  try {
    await service.logoutAll(req.user!.id);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

authRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await repo.findUserById(req.user!.id);
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

