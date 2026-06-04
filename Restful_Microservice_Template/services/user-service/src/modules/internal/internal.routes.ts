import { Router } from "express";
import { asyncHandler } from "@restful/service-kit";
import { requireInternalService } from "@/middleware/internal-auth.js";
import { validateBody, validateParams } from "@restful/service-kit";
import {
  createUser,
  getAuthContext,
  getAuthContextByEmail,
  recordLastLogin,
  updateAccountState,
} from "@/modules/internal/internal.controller.js";
import {
  createUserSchema,
  emailParamsSchema,
  updateAccountStateSchema,
  userIdParamsSchema,
} from "@/modules/internal/internal.validation.js";

export const internalRoutes = Router();

internalRoutes.use(requireInternalService);

internalRoutes.post("/", validateBody(createUserSchema.shape.body), asyncHandler(createUser));
internalRoutes.get("/:id/auth-context", validateParams(userIdParamsSchema.shape.params), asyncHandler(getAuthContext));
internalRoutes.get(
  "/by-email/:email/auth-context",
  validateParams(emailParamsSchema.shape.params),
  asyncHandler(getAuthContextByEmail),
);
internalRoutes.patch(
  "/:id/account-state",
  validateParams(updateAccountStateSchema.shape.params),
  validateBody(updateAccountStateSchema.shape.body),
  asyncHandler(updateAccountState),
);
internalRoutes.post("/:id/last-login", validateParams(userIdParamsSchema.shape.params), asyncHandler(recordLastLogin));
