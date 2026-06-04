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

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
