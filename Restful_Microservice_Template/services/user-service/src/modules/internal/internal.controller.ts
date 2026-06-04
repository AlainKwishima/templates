import type { Request, Response } from "express";
import { successResponse } from "@restful/shared";
import { getRequestId } from "@restful/service-kit";
import { InternalUsersService } from "@/modules/internal/internal.service.js";

const internalUsersService = new InternalUsersService();

export async function createUser(req: Request, res: Response) {
  const user = await internalUsersService.createUser(req.body);
  res.status(201).json(successResponse("User profile created", { user }, { requestId: getRequestId(req) }));
}

export async function getAuthContext(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const context = await internalUsersService.getAuthContext(userId!);
  res.json(successResponse("Auth context loaded", context, { requestId: getRequestId(req) }));
}

export async function getAuthContextByEmail(req: Request, res: Response) {
  const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const context = await internalUsersService.getAuthContextByEmail(email!);
  res.json(successResponse("Auth context loaded", context, { requestId: getRequestId(req) }));
}

export async function updateAccountState(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await internalUsersService.updateAccountState(userId!, req.body);
  res.json(successResponse("Account state updated", { user }, { requestId: getRequestId(req) }));
}

export async function recordLastLogin(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await internalUsersService.recordLastLogin(userId!);
  res.json(successResponse("Last login recorded", { recorded: true }, { requestId: getRequestId(req) }));
}
