import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { reportsService } from '../service/reports.service';

export const userReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportsService.getUserReport();
  sendSuccess(res, report, 'User report generated successfully');
});

export const resourceReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportsService.getResourceReport();
  sendSuccess(res, report, 'Resource report generated successfully');
});

export const transactionReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportsService.getTransactionReport();
  sendSuccess(res, report, 'Transaction report generated successfully');
});

export const departmentReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportsService.getDepartmentReport();
  sendSuccess(res, report, 'Department report generated successfully');
});
