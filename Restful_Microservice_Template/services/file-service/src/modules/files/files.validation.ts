import { z } from "zod";

export const listFilesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
  }).optional(),
});

export const fileIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateFileSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    originalName: z.string().min(1).max(255),
  }),
});
