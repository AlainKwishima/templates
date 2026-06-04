import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from './config/env';
import { sendError, sendSuccess } from '@shared/lib';

const app = express();
app.use(helmet());
app.use(cors());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

const proxyConfig = (serviceName: string, target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: 30000,
    timeout: 30000,
    on: {
      proxyReq: (proxyReq, req) => {
        const authorization = req.headers.authorization;
        if (authorization) {
          proxyReq.setHeader('authorization', authorization);
        }
      },
      error: (_err, _req, res) => {
        const response = res as express.Response;
        if (!response.headersSent) {
          response.writeHead(503, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({
              success: false,
              message: `Bad Gateway - ${serviceName} unavailable`,
              data: null,
            }),
          );
        }
      },
    },
  });

const mount = (prefix: string, serviceName: string, target: string) => {
  const proxy = proxyConfig(serviceName, target);
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith(prefix)) {
      return proxy(req, res, next);
    }
    next();
  });
};

mount('/api/v1/auth', 'auth-service', env.AUTH_SERVICE_URL);
mount('/api/v1/users', 'user-service', env.USER_SERVICE_URL);
mount('/api/v1/roles', 'role-service', env.ROLE_SERVICE_URL);
mount('/api/v1/departments', 'department-service', env.DEPARTMENT_SERVICE_URL);
mount('/api/v1/resources', 'resource-service', env.RESOURCE_SERVICE_URL);
mount('/api/v1/transactions', 'transaction-service', env.TRANSACTION_SERVICE_URL);
mount('/api/v1/reports', 'report-service', env.REPORT_SERVICE_URL);
mount('/api/v1/dashboard', 'dashboard-service', env.DASHBOARD_SERVICE_URL);

export default app;
