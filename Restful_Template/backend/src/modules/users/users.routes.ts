import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler.js";
import { authenticateRequest, authorizeRoles, requireUser } from "@/middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "@/middleware/validate.js";
import {
  listUsersSchema,
  updateProfileSchema,
  updateUserRolesSchema,
  updateUserStatusSchema,
} from "@/modules/users/users.validation.js";
import {
  getMe,
  listRoles,
  listUsers,
  updateMe,
  updateUserRoles,
  updateUserStatus,
} from "@/modules/users/users.controller.js";

export const userRoutes = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Current authenticated user
 */
userRoutes.get("/me", authenticateRequest, requireUser, asyncHandler(getMe));
userRoutes.patch("/me", authenticateRequest, requireUser, validateBody(updateProfileSchema.shape.body), asyncHandler(updateMe));

userRoutes.get(
  "/admin",
  authenticateRequest,
  requireUser,
  authorizeRoles("admin"),
  validateQuery(listUsersSchema.shape.query),
  asyncHandler(listUsers),
);

userRoutes.get(
  "/admin/roles",
  authenticateRequest,
  requireUser,
  authorizeRoles("admin"),
  asyncHandler(listRoles),
);

userRoutes.patch(
  "/admin/:id/status",
  authenticateRequest,
  requireUser,
  authorizeRoles("admin"),
  validateParams(updateUserStatusSchema.shape.params),
  validateBody(updateUserStatusSchema.shape.body),
  asyncHandler(updateUserStatus),
);

userRoutes.patch(
  "/admin/:id/roles",
  authenticateRequest,
  requireUser,
  authorizeRoles("admin"),
  validateParams(updateUserRolesSchema.shape.params),
  validateBody(updateUserRolesSchema.shape.body),
  asyncHandler(updateUserRoles),
);
