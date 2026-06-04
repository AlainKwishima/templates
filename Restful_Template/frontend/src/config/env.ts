import { z } from "zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().default("National_Examination"),
  VITE_APP_URL: z.string().url().default("http://localhost:5173"),
  VITE_API_BASE_URL: z.string().url().default("http://localhost:4000/api/v1"),
  VITE_STORAGE_PREFIX: z.string().default("national-examination"),
});

export const env = envSchema.parse(import.meta.env);
