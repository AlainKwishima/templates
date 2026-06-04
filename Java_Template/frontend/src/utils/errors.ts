import type { ApiError } from '@/api/types';
import { isAxiosError } from 'axios';

export class ApiClientError extends Error {
  status: number;
  errors: ApiError[];
  code?: string;

  constructor(message: string, status: number, errors: ApiError[] = [], code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export function getFieldErrors(errors: ApiError[]): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, err) => {
    if (err.field) {
      acc[err.field] = err.message;
    }
    return acc;
  }, {});
}

export function getGlobalError(errors: ApiError[]): string | undefined {
  const global = errors.find((e) => !e.field);
  return global?.message;
}

export function parseApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const data = error.response?.data as
      | { message?: string; errors?: ApiError[] }
      | undefined;
    const message = data?.message ?? error.message ?? 'An unexpected error occurred';
    const errors = data?.errors ?? [];
    const code = errors.find((e) => e.code)?.code;
    return new ApiClientError(message, status, errors, code);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 500);
  }

  return new ApiClientError('An unexpected error occurred', 500);
}

export function isEmailNotVerifiedError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.status === 403 && parsed.code === 'EMAIL_NOT_VERIFIED';
}
