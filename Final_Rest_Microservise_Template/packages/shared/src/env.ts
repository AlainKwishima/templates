import { z, type ZodTypeAny } from 'zod';

export function loadEnv<T extends ZodTypeAny>(
  serviceName: string,
  schema: T,
): z.infer<T> {
  const parsed = schema.safeParse(process.env);

  if (parsed.success) {
    return parsed.data;
  }

  for (const issue of parsed.error.issues) {
    const field = issue.path.join('.') || 'unknown';
    console.error(`[${serviceName}] Configuration error: ${field}: ${issue.message}`);
  }

  process.exit(1);
}

