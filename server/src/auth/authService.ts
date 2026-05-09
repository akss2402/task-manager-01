import crypto from "node:crypto";
import { HttpError } from "../http/errors.js";
import { sha256Base64Url } from "../utils/crypto.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import * as repo from "./authRepo.js";

function randomId() {
  return crypto.randomUUID();
}

function computeRefreshExpiryDate(ttl: string) {
  // Keep it intentionally simple (no heavy libs). Supported suffixes: s, m, h, d
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Unsupported REFRESH_TOKEN_TTL format: ${ttl}`);
  const amount = Number(match[1]);
  const unit = match[2];
  const ms =
    unit === "s"
      ? amount * 1000
      : unit === "m"
        ? amount * 60_000
        : unit === "h"
          ? amount * 3_600_000
          : amount * 86_400_000;
  return new Date(Date.now() + ms);
}

export async function signup(input: { name: string; email: string; password: string; role?: string }) {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) throw new HttpError(409, "Email already in use", { code: "EMAIL_TAKEN" });

  const passwordHash = await hashPassword(input.password);
  const user = await repo.createUser({ name: input.name, email: input.email, passwordHash, role: input.role });
  return user;
}

export async function login(input: { email: string; password: string }) {
  const user = await repo.findUserByEmail(input.email);
  if (!user) throw new HttpError(401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) throw new HttpError(401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function issueTokensForUser(userId: string, refreshTtl: string) {
  const refreshId = randomId();
  const refreshToken = signRefreshToken(userId, refreshId);
  const tokenHash = sha256Base64Url(refreshToken);
  const expiresAt = computeRefreshExpiryDate(refreshTtl);
  await repo.insertRefreshToken({ id: refreshId, userId, tokenHash, expiresAt });

  const accessToken = signAccessToken(userId);
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

export async function refreshTokens(refreshToken: string, refreshTtl: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = sha256Base64Url(refreshToken);

  const row = await repo.findRefreshTokenByHash(tokenHash);
  if (!row) throw new HttpError(401, "Invalid refresh token", { code: "INVALID_REFRESH" });
  if (row.revoked_at) throw new HttpError(401, "Refresh token revoked", { code: "REVOKED_REFRESH" });
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new HttpError(401, "Refresh token expired", { code: "EXPIRED_REFRESH" });
  }
  if (row.id !== payload.jti || row.user_id !== payload.sub) {
    throw new HttpError(401, "Invalid refresh token", { code: "INVALID_REFRESH" });
  }

  // Rotation: revoke old, issue new
  await repo.revokeRefreshTokenByHash(tokenHash);
  return issueTokensForUser(payload.sub, refreshTtl);
}

export async function logout(refreshToken: string) {
  const tokenHash = sha256Base64Url(refreshToken);
  await repo.revokeRefreshTokenByHash(tokenHash);
}

export async function logoutAll(userId: string) {
  await repo.revokeAllRefreshTokensForUser(userId);
}

