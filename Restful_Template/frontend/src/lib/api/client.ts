import { env } from "@/config/env";
import type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "@/types/api";
import { ApiClientError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/session";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

function buildUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), env.VITE_API_BASE_URL.endsWith("/")
    ? env.VITE_API_BASE_URL
    : `${env.VITE_API_BASE_URL}/`);
}

async function parseResponse<T>(response: Response): Promise<ApiSuccessResponse<T> | string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiSuccessResponse<T>;
  }

  return await response.text();
}

async function normalizeError(response: Response): Promise<ApiClientError> {
  const parsed = (await parseResponse<ApiResponse<unknown>>(response).catch(() => null)) as ApiErrorResponse | null;
  if (parsed && typeof parsed === "object" && parsed.success === false) {
    return new ApiClientError(parsed.message, {
      status: response.status,
      code: parsed.error.code,
      details: parsed.error.details,
      metadata: parsed.metadata,
    });
  }

  return new ApiClientError(response.statusText || "Request failed", {
    status: response.status,
  });
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccessResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body !== undefined && options.body !== null && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = options.auth === false ? null : getAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
    body:
      options.body === undefined || options.body === null
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }

  const parsed = await parseResponse<T>(response);

  if (parsed && typeof parsed === "object" && "success" in parsed && parsed.success) {
    return parsed;
  }

  throw new ApiClientError("Unexpected response shape", {
    status: response.status,
  });
}

export async function requestData<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request<T>(path, options);
  return response.data;
}
