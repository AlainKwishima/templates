import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
});

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
