import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { fetchJsonWith, jsonResponse, makeJwt, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('transaction-service', () => {
  let server: Server;
  let baseUrl: string;
  const realFetch = global.fetch.bind(global);
  const fetchMock = jest.fn();

  beforeAll(async () => {
    process.env.PORT = '3006';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=transactions';
    process.env.JWT_SECRET = 't'.repeat(32);
    process.env.USER_SERVICE_URL = 'http://user-service.test';
    process.env.RESOURCE_SERVICE_URL = 'http://resource-service.test';
    process.env.NOTIFICATION_SERVICE_URL = 'http://notification-service.test';

    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
    fetchMock.mockReset();

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

  it('creates a transaction after validating downstream references', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/internal/users/')) {
        return jsonResponse({
          success: true,
          data: {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
        });
      }

      if (url.includes('/internal/resources/')) {
        return jsonResponse({
          success: true,
          data: {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            name: 'Projector',
          },
        });
      }

      if (url.includes('/api/v1/notifications/send')) {
        return jsonResponse({ success: true, data: { id: crypto.randomUUID(), emailSent: true } });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const token = makeJwt(process.env.JWT_SECRET ?? '');
    const { response, data } = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        resourceId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        transactionDate: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        notes: 'Initial checkout',
      }),
    });

    expect(response.status).toBe(201);
    expect(data.data.status).toBe('Pending');
  });

  it('rejects invalid status transitions', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/internal/users/')) {
        return jsonResponse({
          success: true,
          data: {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
        });
      }

      if (url.includes('/internal/resources/')) {
        return jsonResponse({
          success: true,
          data: {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            name: 'Projector',
          },
        });
      }

      if (url.includes('/api/v1/notifications/send')) {
        return jsonResponse({ success: true, data: { id: crypto.randomUUID(), emailSent: true } });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const token = makeJwt(process.env.JWT_SECRET ?? '');
    const create = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        resourceId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        transactionDate: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      }),
    });

    const transition = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/transactions/${create.data.data.id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 'Completed',
      }),
    });

    expect(transition.response.status).toBe(422);
  });
});
