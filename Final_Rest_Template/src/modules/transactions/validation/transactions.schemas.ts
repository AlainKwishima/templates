import { z } from 'zod';
import { paginationQuerySchema } from '../../../shared/zod/common.schemas';

export const transactionQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  status: z.enum(['Pending', 'Active', 'Completed', 'Cancelled']).optional(),
});

export const createTransactionSchema = z.object({
  userId: z.string().uuid(),
  resourceId: z.string().uuid(),
  transactionDate: z.coerce.date(),
  returnDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateTransactionSchema = z.object({
  transactionDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional().nullable(),
  status: z.enum(['Pending', 'Active', 'Completed', 'Cancelled']).optional(),
  notes: z.string().optional().nullable(),
});
