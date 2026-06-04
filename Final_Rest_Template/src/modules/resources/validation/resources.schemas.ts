import { z } from 'zod';
import { paginationQuerySchema } from '../../../shared/zod/common.schemas';

export const resourceQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().uuid().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  sortBy: z.enum(['name', 'code', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createResourceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
  departmentId: z.string().uuid(),
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['Active', 'Inactive']).optional(),
  departmentId: z.string().uuid().optional(),
});
