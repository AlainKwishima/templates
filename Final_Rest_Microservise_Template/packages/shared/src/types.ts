export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface Envelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedEnvelope<T = unknown> extends Envelope<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

