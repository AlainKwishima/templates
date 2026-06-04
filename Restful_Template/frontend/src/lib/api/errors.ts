import type { ApiMetadata } from "@/types/api";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;
  metadata?: ApiMetadata;

  constructor(message: string, options: { status: number; code?: string; details?: unknown; metadata?: ApiMetadata }){
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code ?? "API_ERROR";
    this.details = options.details;
    this.metadata = options.metadata;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
