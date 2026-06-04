import { ApiClientError } from "@/lib/api/errors";
import { request, type RequestOptions } from "@/lib/api/client";
import { bootstrapAuthSession } from "@/lib/auth/bootstrap";
import { getAccessToken } from "@/lib/auth/session";
import type { ApiSuccessResponse } from "@/types/api";

export async function authenticatedRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccessResponse<T>> {
  const token = getAccessToken();
  try {
    return await request<T>(path, {
      ...options,
      auth: true,
      headers: {
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      await bootstrapAuthSession();
      const refreshedToken = getAccessToken();
      if (refreshedToken) {
        return request<T>(path, {
          ...options,
          auth: true,
          headers: {
            ...(options.headers ?? {}),
            Authorization: `Bearer ${refreshedToken}`,
          },
        });
      }
    }

    throw error;
  }
}
