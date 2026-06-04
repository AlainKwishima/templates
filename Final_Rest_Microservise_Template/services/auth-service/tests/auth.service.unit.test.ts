import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { fetchJson, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('auth-service', () => {
  let app: import('express').Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PORT = '3001';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=auth';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@example.com';
    process.env.BREVO_SENDER_NAME = 'Institution Starter Kit';

    app = require('../src/app').default;
    ({ server, baseUrl } = await startTestServer(app));
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  it('exposes health information', async () => {
    const { response, data } = await fetchJson(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('registers, logs in, rotates refresh tokens, and logs out', async () => {
    const email = `user-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    const register = await fetchJson(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email,
        password,
      }),
    });

    expect(register.response.status).toBe(201);
    expect(register.data.success).toBe(true);

    const login = await fetchJson(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    expect(login.response.status).toBe(200);
    expect(login.data.data).toHaveProperty('accessToken');
    expect(login.data.data).toHaveProperty('refreshToken');

    const firstRefreshToken = login.data.data.refreshToken as string;

    const refresh = await fetchJson(`${baseUrl}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: firstRefreshToken }),
    });

    expect(refresh.response.status).toBe(200);
    expect(refresh.data.data.refreshToken).not.toBe(firstRefreshToken);

    const logout = await fetchJson(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh.data.data.refreshToken }),
    });

    expect(logout.response.status).toBe(200);
    expect(logout.data.message).toContain('Logged out');
  });
});

