import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Express } from 'express';
import { fetchJson, stopTestServer } from '../../../tests/service-test-utils';
import { sendError } from '@shared/lib';

jest.setTimeout(30000);

describe('api-gateway', () => {
  let downstreamServer: Server;
  let downstreamBaseUrl: string;
  let gatewayServer: Server;
  let gatewayBaseUrl: string;

  beforeAll(async () => {
    downstreamServer = http.createServer((req, res) => {
      if (req.url?.startsWith('/api/v1/auth')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            message: 'proxied',
            data: {
              path: req.url,
              authorization: req.headers.authorization ?? null,
            },
          }),
        );
        return;
      }

      if (req.url?.startsWith('/api/v1/users')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'users', data: [] }));
        return;
      }

      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'not found', data: null }));
    });

    await new Promise<void>((resolve) => {
      downstreamServer.listen(0, resolve);
    });

    const downstreamAddress = downstreamServer.address() as AddressInfo;
    downstreamBaseUrl = `http://127.0.0.1:${downstreamAddress.port}`;

    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SERVICE_URL = downstreamBaseUrl;
    process.env.USER_SERVICE_URL = downstreamBaseUrl;
    process.env.ROLE_SERVICE_URL = downstreamBaseUrl;
    process.env.DEPARTMENT_SERVICE_URL = downstreamBaseUrl;
    process.env.RESOURCE_SERVICE_URL = downstreamBaseUrl;
    process.env.TRANSACTION_SERVICE_URL = downstreamBaseUrl;
    process.env.NOTIFICATION_SERVICE_URL = downstreamBaseUrl;
    process.env.REPORT_SERVICE_URL = 'http://127.0.0.1:6553';
    process.env.DASHBOARD_SERVICE_URL = downstreamBaseUrl;
    process.env.PUBLIC_GATEWAY_URL = 'http://127.0.0.1:3000';
    process.env.DISABLE_SWAGGER = 'true';

    jest.resetModules();
    const app = require('../src/app').default as Express;
    app.use((_req, res) => sendError(res, 'Route not found', 404));
    gatewayServer = app.listen(0);
    await new Promise<void>((resolve) => {
      gatewayServer.on('listening', () => resolve());
    });
    const gatewayAddress = gatewayServer.address() as AddressInfo;
    gatewayBaseUrl = `http://127.0.0.1:${gatewayAddress.port}`;
  });

  afterAll(async () => {
    await stopTestServer(gatewayServer);
    await stopTestServer(downstreamServer);
  });

  it('routes requests and preserves authorization headers', async () => {
    const { response, data } = await fetchJson(`${gatewayBaseUrl}/api/v1/auth/profile`, {
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    expect(response.status).toBe(200);
    expect(data.data.authorization).toBe('Bearer test-token');
    expect(data.data.path).toBe('/api/v1/auth/profile');
  });

  it('returns 404 for unmatched routes', async () => {
    const { response, data } = await fetchJson(`${gatewayBaseUrl}/no-such-route`);
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 503 when a downstream service is unavailable', async () => {
    const { response, data } = await fetchJson(`${gatewayBaseUrl}/api/v1/reports/users`);
    expect(response.status).toBe(503);
    expect(data.message).toContain('report-service');
  });
});

