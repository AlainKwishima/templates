import { AppError } from './errors';

type RequestJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  serviceName?: string;
};

export async function requestJson<T>(
  url: string,
  options: RequestJsonOptions = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await response.json()) as T)
      : ((await response.text()) as unknown as T);

    return { ok: response.ok, status: response.status, data: data ?? null };
  } catch (error) {
    const serviceName = options.serviceName ?? 'downstream-service';
    throw new AppError(`Bad Gateway - ${serviceName} unavailable`, 502, [
      { field: serviceName, message: error instanceof Error ? error.message : 'Request failed' },
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

