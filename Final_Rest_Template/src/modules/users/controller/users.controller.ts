import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { paginationMeta } from '../../../utils/pagination';
import { sendSuccess } from '../../../utils/response';
import { usersService } from '../service/users.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.getAll(req.query as never);
  sendSuccess(res, result.data, 'Users retrieved successfully', 200, paginationMeta(result));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getById(req.params.id);
  sendSuccess(res, user, 'User retrieved successfully');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.create(req.body);
  sendSuccess(res, user, 'User created successfully', 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.update(req.params.id, req.body);
  sendSuccess(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await usersService.delete(req.params.id);
  sendSuccess(res, null, 'User deleted successfully');
});
