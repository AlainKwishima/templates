export interface ApiMetadata {
  requestId?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  metadata?: ApiMetadata;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  metadata?: ApiMetadata;
}

export function successResponse<T>(message: string, data: T, metadata?: ApiMetadata): ApiSuccessResponse<T> {
  return { success: true, message, data, metadata };
}

export function errorResponse(
  message: string,
  code: string,
  details?: unknown,
  metadata?: ApiMetadata,
): ApiErrorResponse {
  return {
    success: false,
    message,
    error: { code, details },
    metadata,
  };
}
