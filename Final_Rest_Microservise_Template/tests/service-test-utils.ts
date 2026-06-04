import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Express } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export async function startTestServer(app: Express): Promise<{ server: Server; baseUrl: string }> {
  const server = app.listen(0);

  await new Promise<void>((resolve) => {
    server.on('listening', () => resolve());
  });

  const address = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

export async function stopTestServer(server: Server): Promise<void> {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

export async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  const data = text.length > 0 ? JSON.parse(text) : null;

  return { response, data };
}

export async function fetchJsonWith(fetchImpl: typeof fetch, url: string, init?: RequestInit) {
  const response = await fetchImpl(url, init);
  const text = await response.text();
  const data = text.length > 0 ? JSON.parse(text) : null;

  return { response, data };
}

export function makeJwt(secret: string, role = 'Admin', overrides: Partial<{ userId: string; email: string; role: string }> = {}) {
  return jwt.sign(
    {
      userId: overrides.userId ?? crypto.randomUUID(),
      email: overrides.email ?? 'test@example.com',
      role: overrides.role ?? role,
    },
    secret,
  );
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}
