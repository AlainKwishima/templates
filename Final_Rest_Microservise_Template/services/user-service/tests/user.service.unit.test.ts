import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { fetchJson, makeJwt, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('user-service', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PORT = '3002';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=users';
    process.env.JWT_SECRET = 'y'.repeat(32);

    const app = require('../src/app').default;
    ({ server, baseUrl } = await startTestServer(app));
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  it('returns health information', async () => {
    const { response, data } = await fetchJson(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(data.data).toEqual({ status: 'ok' });
  });

  it('requires authentication for protected endpoints and supports admin CRUD', async () => {
    const secret = process.env.JWT_SECRET ?? '';
    const token = makeJwt(secret);

    const unauthorized = await fetchJson(`${baseUrl}/api/v1/users`);
    expect(unauthorized.response.status).toBe(401);

    const list = await fetchJson(`${baseUrl}/api/v1/users?page=1&limit=10`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.response.status).toBe(200);
    expect(list.data.page).toBe(1);
    expect(list.data.limit).toBe(10);
    expect(list.data.data.some((user: { email: string }) => user.email === 'admin@institution.local')).toBe(true);

    const email = `admin-${crypto.randomUUID()}@example.com`;
    const create = await fetchJson(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Created',
        lastName: 'User',
        email,
        password: 'Password123!',
        roleId: '11111111-1111-1111-1111-111111111111',
      }),
    });

    expect(create.response.status).toBe(201);
    expect(create.data.data.email).toBe(email);
  });
});

