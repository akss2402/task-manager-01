import jwt from "jsonwebtoken";
import { getConfig } from "../config.js";

function signOptions(expiresIn: string): jwt.SignOptions {
  // jsonwebtoken's TS types can be picky about StringValue; env values are strings.
  return { expiresIn: expiresIn as unknown as jwt.SignOptions["expiresIn"] };
}

export type AccessTokenPayload = {
  sub: string; // user id
  typ: "access";
};

export type RefreshTokenPayload = {
  sub: string; // user id
  typ: "refresh";
  jti: string; // token id
};

export function signAccessToken(userId: string) {
  const { JWT_ACCESS_SECRET, ACCESS_TOKEN_TTL } = getConfig();
  return jwt.sign(
    { sub: userId, typ: "access" } satisfies AccessTokenPayload,
    JWT_ACCESS_SECRET,
    signOptions(ACCESS_TOKEN_TTL)
  );
}

export function signRefreshToken(userId: string, jti: string) {
  const { JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL } = getConfig();
  return jwt.sign(
    { sub: userId, typ: "refresh", jti } satisfies RefreshTokenPayload,
    JWT_REFRESH_SECRET,
    signOptions(REFRESH_TOKEN_TTL)
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { JWT_ACCESS_SECRET } = getConfig();
  const payload = jwt.verify(token, JWT_ACCESS_SECRET) as jwt.JwtPayload;
  if (payload?.typ !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token");
  }
  return { sub: payload.sub, typ: "access" };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const { JWT_REFRESH_SECRET } = getConfig();
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (
    payload?.typ !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }
  return { sub: payload.sub, typ: "refresh", jti: payload.jti };
}

