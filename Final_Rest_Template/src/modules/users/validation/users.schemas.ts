import { z } from 'zod';
import { emailSchema, paginationQuerySchema, passwordSchema } from '../../../shared/zod/common.schemas';

export const userQuerySchema = paginationQuerySchema;

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: emailSchema,
  password: passwordSchema,
  roleId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  roleId: z.string().uuid().optional(),
});
