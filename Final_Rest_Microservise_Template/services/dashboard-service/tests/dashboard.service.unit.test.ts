import type { Server } from 'node:http';
import { fetchJsonWith, jsonResponse, makeJwt, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('dashboard-service', () => {
  let server: Server;
  let baseUrl: string;
  const realFetch = global.fetch.bind(global);
  const fetchMock = jest.fn();

  beforeAll(async () => {
    process.env.PORT = '3009';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'p'.repeat(32);
    process.env.USER_SERVICE_URL = 'http://user-service.test';
    process.env.RESOURCE_SERVICE_URL = 'http://resource-service.test';
    process.env.TRANSACTION_SERVICE_URL = 'http://transaction-service.test';
    process.env.DEPARTMENT_SERVICE_URL = 'http://department-service.test';

    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
    const app = require('../src/app').default;
    ({ server, baseUrl } = await startTestServer(app));
  });

  afterAll(async () => {
    await stopTestServer(server);
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns a partial dashboard when one service is unavailable', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/users')) {
        return jsonResponse({
          success: true,
          message: 'ok',
          data: [{ id: '1', role: 'Admin' }],
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        });
      }

      if (url.includes('/api/v1/resources')) {
        throw new Error('resource service unavailable');
      }

      if (url.includes('/api/v1/transactions')) {
        return jsonResponse({
          success: true,
          message: 'ok',
          data: [{ id: '1', status: 'Pending' }],
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        });
      }

      if (url.includes('/api/v1/departments')) {
        return jsonResponse({
          success: true,
          message: 'ok',
          data: [{ id: '1', name: 'General Studies' }],
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const token = makeJwt(process.env.JWT_SECRET ?? '');
    const { response, data } = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/dashboard`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(data.data.unavailableServices).toContain('resource-service');
  });
});
