import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { paginationMeta } from '../../../utils/pagination';
import { sendSuccess } from '../../../utils/response';
import { resourcesService } from '../service/resources.service';

export const listResources = asyncHandler(async (req: Request, res: Response) => {
  const result = await resourcesService.getAll(req.query as never);
  sendSuccess(res, result.data, 'Resources retrieved successfully', 200, paginationMeta(result));
});

export const getResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourcesService.getById(req.params.id);
  sendSuccess(res, resource, 'Resource retrieved successfully');
});

export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourcesService.create(req.body);
  sendSuccess(res, resource, 'Resource created successfully', 201);
});

export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await resourcesService.update(req.params.id, req.body);
  sendSuccess(res, resource, 'Resource updated successfully');
});

export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  await resourcesService.delete(req.params.id);
  sendSuccess(res, null, 'Resource deleted successfully');
});
