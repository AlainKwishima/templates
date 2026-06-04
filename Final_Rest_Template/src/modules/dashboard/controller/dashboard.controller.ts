import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { dashboardService } from '../service/dashboard.service';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await dashboardService.getSummary();
  sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
});
