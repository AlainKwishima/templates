import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  AppError,
  asyncHandler,
  authenticate,
  authorise,
  requestJson,
  sendError,
  sendSuccess,
  mountSwagger,
  dashboardOpenApi,
} from '@shared/lib';
import { env } from './config/env';

type ListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

async function fetchList<T>(url: string, authorization: string | undefined, serviceName: string) {
  const response = await requestJson<ListResponse<T>>(url, {
    headers: authorization ? { authorization } : {},
    timeoutMs: 5000,
    serviceName,
  });
  if (!response.ok || !response.data) {
    throw new AppError(`${serviceName} unavailable`, 503);
  }
  return response.data;
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.get(
  '/api/v1/dashboard',
  authenticate,
  authorise('Admin'),
  asyncHandler(async (req, res) => {
    const calls = await Promise.allSettled([
      fetchList<Record<string, unknown>>(`${env.USER_SERVICE_URL}/api/v1/users?page=1&limit=100`, req.headers.authorization, 'user-service'),
      fetchList<Record<string, unknown>>(`${env.RESOURCE_SERVICE_URL}/api/v1/resources?page=1&limit=100`, req.headers.authorization, 'resource-service'),
      fetchList<Record<string, unknown>>(`${env.TRANSACTION_SERVICE_URL}/api/v1/transactions?page=1&limit=100`, req.headers.authorization, 'transaction-service'),
      fetchList<Record<string, unknown>>(`${env.DEPARTMENT_SERVICE_URL}/api/v1/departments?page=1&limit=100`, req.headers.authorization, 'department-service'),
    ]);

    const unavailableServices: string[] = [];
    const [usersResult, resourcesResult, transactionsResult, departmentsResult] = calls.map((entry, index) => {
      if (entry.status === 'rejected') {
        unavailableServices.push(['user-service', 'resource-service', 'transaction-service', 'department-service'][index]);
        return null;
      }
      return entry.value;
    });

    const payload = {
      totalUsers: usersResult?.total ?? 0,
      totalResources: resourcesResult?.total ?? 0,
      totalTransactions: transactionsResult?.total ?? 0,
      totalDepartments: departmentsResult?.total ?? 0,
      unavailableServices,
      recentUsers: usersResult?.data.slice(0, 5) ?? [],
      recentResources: resourcesResult?.data.slice(0, 5) ?? [],
      recentTransactions: transactionsResult?.data.slice(0, 5) ?? [],
      recentDepartments: departmentsResult?.data.slice(0, 5) ?? [],
    };

    sendSuccess(res, payload, 'Dashboard summary retrieved successfully');
  }),
);

mountSwagger(app, {
  serviceName: 'dashboard-service',
  spec: dashboardOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  console.error('[dashboard-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;

