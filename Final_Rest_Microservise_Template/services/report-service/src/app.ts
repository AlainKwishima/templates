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
  reportOpenApi,
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
  try {
    const response = await requestJson<ListResponse<T>>(url, {
      headers: authorization ? { authorization } : {},
      timeoutMs: 5000,
      serviceName,
    });

    if (!response.ok || !response.data) {
      throw new AppError(`${serviceName} unavailable`, 503);
    }

    return response.data;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 502) {
      throw new AppError(`${serviceName} unavailable`, 503, error.errors);
    }
    throw error;
  }
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.get(
  '/api/v1/reports/users',
  authenticate,
  authorise('Admin'),
  asyncHandler(async (req, res) => {
    const users = await fetchList<Record<string, unknown>>(
      `${env.USER_SERVICE_URL}/api/v1/users?page=1&limit=100`,
      req.headers.authorization,
      'user-service',
    );

    const byRole = new Map<string, number>();
    const recentUsers = users.data.slice(0, 10);
    for (const user of users.data) {
      const role = typeof user.role === 'string' ? user.role : 'Unknown';
      byRole.set(role, (byRole.get(role) ?? 0) + 1);
    }

    sendSuccess(res, {
      totalUsers: users.total,
      byRole: Array.from(byRole.entries()).map(([role, count]) => ({ role, count })),
      recentUsers,
    }, 'User report generated successfully');
  }),
);

app.get(
  '/api/v1/reports/resources',
  authenticate,
  authorise('Admin'),
  asyncHandler(async (req, res) => {
    const resources = await fetchList<Record<string, unknown>>(
      `${env.RESOURCE_SERVICE_URL}/api/v1/resources?page=1&limit=100`,
      req.headers.authorization,
      'resource-service',
    );

    const byStatus = new Map<string, number>();
    const byDepartment = new Map<string, number>();
    for (const resource of resources.data) {
      const status = String(resource.status ?? 'Unknown');
      const departmentId = String(resource.departmentId ?? 'unknown');
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
      byDepartment.set(departmentId, (byDepartment.get(departmentId) ?? 0) + 1);
    }

    sendSuccess(res, {
      totalResources: resources.total,
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      byDepartment: Array.from(byDepartment.entries()).map(([department, count]) => ({ department, count })),
      recentResources: resources.data.slice(0, 10),
    }, 'Resource report generated successfully');
  }),
);

app.get(
  '/api/v1/reports/transactions',
  authenticate,
  authorise('Admin'),
  asyncHandler(async (req, res) => {
    const transactions = await fetchList<Record<string, unknown>>(
      `${env.TRANSACTION_SERVICE_URL}/api/v1/transactions?page=1&limit=100`,
      req.headers.authorization,
      'transaction-service',
    );

    const byStatus = new Map<string, number>();
    for (const transaction of transactions.data) {
      const status = String(transaction.status ?? 'Unknown');
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    }

    sendSuccess(res, {
      totalTransactions: transactions.total,
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
      recentTransactions: transactions.data.slice(0, 10),
    }, 'Transaction report generated successfully');
  }),
);

app.get(
  '/api/v1/reports/departments',
  authenticate,
  authorise('Admin'),
  asyncHandler(async (req, res) => {
    const departments = await fetchList<Record<string, unknown>>(
      `${env.DEPARTMENT_SERVICE_URL}/api/v1/departments?page=1&limit=100`,
      req.headers.authorization,
      'department-service',
    );

    sendSuccess(res, {
      totalDepartments: departments.total,
      recentDepartments: departments.data.slice(0, 10),
    }, 'Department report generated successfully');
  }),
);

mountSwagger(app, {
  serviceName: 'report-service',
  spec: reportOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  console.error('[report-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
