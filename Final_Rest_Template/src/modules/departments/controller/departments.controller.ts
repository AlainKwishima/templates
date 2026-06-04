import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { paginationMeta } from '../../../utils/pagination';
import { sendSuccess } from '../../../utils/response';
import { departmentsService } from '../service/departments.service';

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const result = await departmentsService.getAll(req.query as never);
  sendSuccess(res, result.data, 'Departments retrieved successfully', 200, paginationMeta(result));
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await departmentsService.getById(req.params.id);
  sendSuccess(res, dept, 'Department retrieved successfully');
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await departmentsService.create(req.body);
  sendSuccess(res, dept, 'Department created successfully', 201);
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await departmentsService.update(req.params.id, req.body);
  sendSuccess(res, dept, 'Department updated successfully');
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  await departmentsService.delete(req.params.id);
  sendSuccess(res, null, 'Department deleted successfully');
});
