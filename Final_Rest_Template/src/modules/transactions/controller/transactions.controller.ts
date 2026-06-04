import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { paginationMeta } from '../../../utils/pagination';
import { sendSuccess } from '../../../utils/response';
import { transactionsService } from '../service/transactions.service';

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionsService.getAll(req.query as never);
  sendSuccess(res, result.data, 'Transactions retrieved successfully', 200, paginationMeta(result));
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const tx = await transactionsService.getById(req.params.id);
  sendSuccess(res, tx, 'Transaction retrieved successfully');
});

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const tx = await transactionsService.create(req.body);
  sendSuccess(res, tx, 'Transaction created successfully', 201);
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const tx = await transactionsService.update(req.params.id, req.body);
  sendSuccess(res, tx, 'Transaction updated successfully');
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  await transactionsService.delete(req.params.id);
  sendSuccess(res, null, 'Transaction deleted successfully');
});
