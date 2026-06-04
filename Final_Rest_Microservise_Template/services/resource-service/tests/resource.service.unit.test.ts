import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { fetchJson, makeJwt, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('resource-service', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PORT = '3005';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=resources';
    process.env.JWT_SECRET = 'r'.repeat(32);

    const app = require('../src/app').default;
    ({ server, baseUrl } = await startTestServer(app));
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  it('creates and updates resources for admins', async () => {
    const token = makeJwt(process.env.JWT_SECRET ?? '');

    const create = await fetchJson(`${baseUrl}/api/v1/resources`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: `Resource-${crypto.randomUUID()}`,
        description: 'Test resource',
        departmentId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        status: 'Active',
        quantity: 3,
      }),
    });

    expect(create.response.status).toBe(201);

    const update = await fetchJson(`${baseUrl}/api/v1/resources/${create.data.data.id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        quantity: 5,
      }),
    });

    expect(update.response.status).toBe(200);
    expect(update.data.data.quantity).toBe(5);
  });
});

