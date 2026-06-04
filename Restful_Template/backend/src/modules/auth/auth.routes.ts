import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler.js";
import { authenticateRequest, requireUser } from "@/middleware/auth.js";
import { validateBody } from "@/middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/modules/auth/auth.validation.js";
import {
  login,
  logout,
  me,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "@/modules/auth/auth.controller.js";

export const authRoutes = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
authRoutes.post("/register", validateBody(registerSchema.shape.body), asyncHandler(register));
authRoutes.post("/login", validateBody(loginSchema.shape.body), asyncHandler(login));
authRoutes.post("/refresh", validateBody(refreshSchema.shape.body), asyncHandler(refresh));
authRoutes.post("/logout", validateBody(logoutSchema.shape.body), asyncHandler(logout));
authRoutes.post("/forgot-password", validateBody(forgotPasswordSchema.shape.body), asyncHandler(requestPasswordReset));
authRoutes.post("/reset-password", validateBody(resetPasswordSchema.shape.body), asyncHandler(resetPassword));
authRoutes.post("/verify-email", validateBody(verifyEmailSchema.shape.body), asyncHandler(verifyEmail));
authRoutes.get("/me", authenticateRequest, requireUser, asyncHandler(me));
