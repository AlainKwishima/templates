import { ServiceCommunicationError } from "../errors/app-error.js";

export interface ServiceClientOptions {
  baseUrl: string;
  serviceKey: string;
}

export async function serviceFetch<T>(
  options: ServiceClientOptions,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path.replace(/^\/+/, ""), options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Service-Key": options.serviceKey,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; message: string; error?: { code: string; details?: unknown } }
    | null;

  if (!response.ok || !body || !("success" in body) || body.success !== true) {
    const message =
      body && "message" in body && typeof body.message === "string"
        ? body.message
        : `Service request failed (${response.status})`;
    throw new ServiceCommunicationError(message, {
      status: response.status,
      path: url.pathname,
      details: body && "error" in body ? body.error : undefined,
    });
  }

  return body.data;
}
