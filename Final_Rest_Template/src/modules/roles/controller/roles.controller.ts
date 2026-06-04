import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { rolesService } from '../service/roles.service';

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await rolesService.getAll();
  sendSuccess(res, roles, 'Roles retrieved successfully');
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.getById(req.params.id);
  sendSuccess(res, role, 'Role retrieved successfully');
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.create(req.body);
  sendSuccess(res, role, 'Role created successfully', 201);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await rolesService.update(req.params.id, req.body);
  sendSuccess(res, role, 'Role updated successfully');
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await rolesService.delete(req.params.id);
  sendSuccess(res, null, 'Role deleted successfully');
});
