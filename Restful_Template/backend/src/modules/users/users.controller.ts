import type { Request, Response } from "express";
import { UsersService } from "@/modules/users/users.service.js";
import { successResponse } from "@/shared/response/api-response.js";
import { getRequestId } from "@/middleware/request-context.js";

const usersService = new UsersService();

export async function getMe(req: Request, res: Response) {
  const user = await usersService.getMe(req.user!.id);
  res.json(successResponse("Profile loaded", { user }, { requestId: getRequestId(req) }));
}

export async function updateMe(req: Request, res: Response) {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  res.json(successResponse("Profile updated", { user }, { requestId: getRequestId(req) }));
}

export async function listUsers(req: Request, res: Response) {
  const page = req.query.page;
  const limit = req.query.limit;
  const search = req.query.search;
  const role = req.query.role;
  const status = req.query.status;

  const result = await usersService.listUsers({
    page: typeof page === "string" ? Number(page) : undefined,
    limit: typeof limit === "string" ? Number(limit) : undefined,
    search: typeof search === "string" ? search : undefined,
    role: typeof role === "string" ? role : undefined,
    status: typeof status === "string" ? status : undefined,
  });

  res.json(
    successResponse("Users loaded", result.users, {
      requestId: getRequestId(req),
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }),
  );
}

export async function updateUserStatus(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!userId) {
    throw new Error("User id is required");
  }
  const user = await usersService.setStatus(userId, req.body.status);
  res.json(successResponse("User status updated", { user }, { requestId: getRequestId(req) }));
}

export async function updateUserRoles(req: Request, res: Response) {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!userId) {
    throw new Error("User id is required");
  }
  const user = await usersService.replaceRoles(userId, req.body.roles);
  res.json(successResponse("User roles updated", { user }, { requestId: getRequestId(req) }));
}

export async function listRoles(req: Request, res: Response) {
  const roles = await usersService.getRoles();
  res.json(successResponse("Roles loaded", { roles }, { requestId: getRequestId(req) }));
}
