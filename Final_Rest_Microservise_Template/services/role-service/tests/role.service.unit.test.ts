import type { Server } from 'node:http';
import { fetchJson, makeJwt, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('role-service', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PORT = '3003';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=roles';
    process.env.JWT_SECRET = 'z'.repeat(32);

    const app = require('../src/app').default;
    ({ server, baseUrl } = await startTestServer(app));
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  it('lists roles for an admin user', async () => {
    const token = makeJwt(process.env.JWT_SECRET ?? '');
    const { response, data } = await fetchJson(`${baseUrl}/api/v1/roles?page=1&limit=10`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(data.data).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Admin' })]));
  });
});

