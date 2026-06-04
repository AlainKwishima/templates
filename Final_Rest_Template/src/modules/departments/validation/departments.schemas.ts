import { z } from 'zod';
import { paginationQuerySchema } from '../../../shared/zod/common.schemas';

export const departmentQuerySchema = paginationQuerySchema;

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});
