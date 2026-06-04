import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { fetchJsonWith, jsonResponse, startTestServer, stopTestServer } from '../../../tests/service-test-utils';

jest.setTimeout(30000);

describe('notification-service', () => {
  let server: Server;
  let baseUrl: string;
  const realFetch = global.fetch.bind(global);
  const fetchMock = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    process.env.PORT = '3007';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:mukabareke@localhost:5432/test?schema=notifications';
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@example.com';
    process.env.BREVO_SENDER_NAME = 'Institution Starter Kit';
    process.env.CLIENT_URL = 'http://localhost:5173';

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
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('persists and sends notifications successfully', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'queued' }, 201));

    const { response, data } = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/notifications/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        type: 'welcome',
        subject: 'Welcome',
        body: '<p>Hello</p>',
        metadata: { firstName: 'Amina', email: 'amina@example.com' },
      }),
    });

    expect(response.status).toBe(200);
    expect(data.data.id).toEqual(expect.any(String));
    expect(data.data.emailSent).toBe(true);
  });

  it('returns success even when Brevo fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Brevo unavailable'));

    const { response, data } = await fetchJsonWith(realFetch, `${baseUrl}/api/v1/notifications/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        type: 'transaction-created',
        subject: 'Transaction created',
        body: '<p>Body</p>',
        metadata: { transactionId: crypto.randomUUID(), resourceName: 'Projector', status: 'Pending' },
      }),
    });

    expect(response.status).toBe(200);
    expect(data.data.emailSent).toBe(false);
  });
});
