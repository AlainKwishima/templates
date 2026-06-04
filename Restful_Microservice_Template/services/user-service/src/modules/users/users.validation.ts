import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phoneNumber: z.string().min(5).max(30).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]),
  }),
});

export const updateUserRolesSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    roles: z.array(z.string().min(1)).min(1),
  }),
});
