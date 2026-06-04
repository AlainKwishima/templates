import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phoneNumber: z.string().min(5).max(30).optional(),
  }),
});

export const updateAccountStateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    isEmailVerified: z.boolean().optional(),
    status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]).optional(),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const emailParamsSchema = z.object({
  params: z.object({ email: z.string().email() }),
});
