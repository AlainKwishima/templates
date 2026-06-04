import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { getJwtConfig } from "./config.js";

export interface JwtUserClaims {
  sub: string;
  email: string;
  roles: string[];
  sessionId?: string;
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(claims: JwtUserClaims): string {
  const env = getJwtConfig();
  return jwt.sign(claims, env.accessSecret, {
    expiresIn: env.accessTtl as SignOptions["expiresIn"],
    issuer: env.issuer,
    audience: env.audience,
  });
}

export function signRefreshToken(claims: JwtUserClaims & { tokenFamilyId: string; jti: string }): string {
  const env = getJwtConfig();
  return jwt.sign(claims, env.refreshSecret, {
    expiresIn: env.refreshTtl as SignOptions["expiresIn"],
    issuer: env.issuer,
    audience: env.audience,
  });
}

export function verifyAccessToken(token: string): JwtUserClaims {
  const env = getJwtConfig();
  return jwt.verify(token, env.accessSecret, {
    issuer: env.issuer,
    audience: env.audience,
  }) as JwtUserClaims;
}

export function verifyRefreshToken(
  token: string,
): JwtUserClaims & { tokenFamilyId: string; jti: string } {
  const env = getJwtConfig();
  return jwt.verify(token, env.refreshSecret, {
    issuer: env.issuer,
    audience: env.audience,
  }) as JwtUserClaims & { tokenFamilyId: string; jti: string };
}
