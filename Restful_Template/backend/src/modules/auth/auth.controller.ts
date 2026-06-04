import type { Request, Response } from "express";
import { env } from "@/config/env.js";
import { AuthService } from "@/modules/auth/auth.service.js";
import { successResponse } from "@/shared/response/api-response.js";
import { getRequestIp } from "@/utils/http.js";
import { getRequestId } from "@/middleware/request-context.js";
import { parseDurationToMs } from "@/utils/duration.js";

const authService = new AuthService();

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    ...refreshCookieOptions,
    maxAge: parseDurationToMs(env.JWT_REFRESH_TTL),
  });
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body, {
    ipAddress: getRequestIp(req),
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
  });

  const { user, tokens } = result;
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json(
    successResponse("Registration successful", { user, tokens }, { requestId: getRequestId(req) }),
  );
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body, {
    ipAddress: getRequestIp(req),
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
  });

  const { user, tokens } = result;
  setRefreshCookie(res, tokens.refreshToken);
  res.json(successResponse("Login successful", { user, tokens }, { requestId: getRequestId(req) }));
}

export async function refresh(req: Request, res: Response) {
  const token =
    typeof req.body?.refreshToken === "string"
      ? req.body.refreshToken
      : typeof req.cookies?.refreshToken === "string"
        ? req.cookies.refreshToken
        : undefined;
  if (!token) {
    res.status(400).json(successResponse("Refresh token is required", { refreshed: false }, { requestId: getRequestId(req) }));
    return;
  }
  const result = await authService.refresh(token, {
    ipAddress: getRequestIp(req),
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
  });

  const { user, tokens } = result;
  setRefreshCookie(res, tokens.refreshToken);
  res.json(successResponse("Token refreshed", { user, tokens }, { requestId: getRequestId(req) }));
}

export async function logout(req: Request, res: Response) {
  const token =
    typeof req.body?.refreshToken === "string"
      ? req.body.refreshToken
      : typeof req.cookies?.refreshToken === "string"
        ? req.cookies.refreshToken
        : undefined;
  await authService.logout(token);
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.json(successResponse("Logout successful", { loggedOut: true }, { requestId: getRequestId(req) }));
}

export async function requestPasswordReset(req: Request, res: Response) {
  await authService.requestPasswordReset(req.body.email);
  res.json(successResponse("If the account exists, a reset email was sent", { requested: true }, {
    requestId: getRequestId(req),
  }));
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json(successResponse("Password reset successful", { reset: true }, { requestId: getRequestId(req) }));
}

export async function verifyEmail(req: Request, res: Response) {
  const user = await authService.verifyEmail(req.body.token);
  res.json(successResponse("Email verified successfully", { user }, { requestId: getRequestId(req) }));
}

export async function me(req: Request, res: Response) {
  res.json(successResponse("Current user", { user: req.user }, { requestId: getRequestId(req) }));
}
