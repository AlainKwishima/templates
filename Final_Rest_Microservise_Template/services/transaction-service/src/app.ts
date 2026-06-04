import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import {
  AppError,
  asyncHandler,
  authenticate,
  authorise,
  buildPaginatedResult,
  createMemoryStore,
  paginate,
  paginationQuerySchema,
  requestJson,
  sendError,
  sendSuccess,
  uuidParamSchema,
  mountSwagger,
  transactionOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import { z } from 'zod';

type TransactionStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled';
type Transaction = {
  id: string;
  userId: string;
  resourceId: string;
  userName: string;
  resourceName: string;
  status: TransactionStatus;
  transactionDate: Date;
  returnDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const transactions = createMemoryStore<Transaction>([]);
const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
  Pending: ['Active'],
  Active: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const createSchema = z.object({
  userId: z.string().uuid(),
  resourceId: z.string().uuid(),
  transactionDate: z.coerce.date(),
  returnDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});
const updateSchema = z.object({
  transactionDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional().nullable(),
  status: z.enum(['Pending', 'Active', 'Completed', 'Cancelled']).optional(),
  notes: z.string().optional().nullable(),
});

const validate = (schema: z.ZodTypeAny, target: 'body' | 'params' | 'query' = 'body') => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const source = target === 'body' ? req.body : target === 'params' ? req.params : req.query;
  const result = schema.safeParse(source);
  if (!result.success) {
    sendError(
      res,
      'Validation failed',
      400,
      result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    );
    return;
  }
  if (target === 'body') req.body = result.data;
  if (target === 'params') req.params = result.data as typeof req.params;
  if (target === 'query') req.query = result.data as typeof req.query;
  next();
};

async function validateReference(url: string, serviceName: string) {
  try {
    const result = await requestJson(url, { timeoutMs: 5000, serviceName });
    if (!result.ok) {
      throw new AppError(`${serviceName} validation failed`, 422);
    }
    return result.data as {
      success?: boolean;
      data?: { id: string; firstName?: string; lastName?: string; name?: string; email?: string };
    };
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 502) {
      throw new AppError(`${serviceName} validation failed`, 422, error.errors);
    }
    throw error;
  }
}

async function sendNotification(transaction: Transaction, user: { firstName?: string; lastName?: string; email?: string }, resourceName: string) {
  try {
    await requestJson(`${env.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
      method: 'POST',
      timeoutMs: 3000,
      serviceName: 'notification-service',
      body: {
        userId: transaction.userId,
        type: transaction.status === 'Pending' ? 'transaction-created' : 'transaction-status-update',
        subject: transaction.status === 'Pending' ? 'Transaction created' : 'Transaction updated',
        body: `Transaction ${transaction.id} is now ${transaction.status}.`,
        metadata: {
          firstName: user.firstName ?? 'User',
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User',
          email: user.email ?? '',
          transactionId: transaction.id,
          resourceName,
          status: transaction.status,
        },
      },
    });
  } catch (error) {
    console.warn('[transaction-service] notification send failed:', transaction.id, error instanceof Error ? error.message : error);
  }
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.get(
  '/api/v1/transactions',
  authenticate,
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { skip, take } = paginate(page, limit);
    const items = transactions.all().slice(skip, skip + take);
    sendSuccess(res, items, 'Transactions retrieved successfully', 200, buildPaginatedResult(items, transactions.count(), page, limit));
  }),
);

app.get(
  '/api/v1/transactions/:id',
  authenticate,
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const tx = transactions.findById(req.params.id);
    if (!tx) throw new AppError('Transaction not found', 404);
    sendSuccess(res, tx, 'Transaction retrieved successfully');
  }),
);

app.post(
  '/api/v1/transactions',
  authenticate,
  authorise('Admin', 'Staff'),
  validate(createSchema, 'body'),
  asyncHandler(async (req, res) => {
    const userRef = await validateReference(`${env.USER_SERVICE_URL}/internal/users/${req.body.userId}`, 'user-service');
    const resourceRef = await validateReference(`${env.RESOURCE_SERVICE_URL}/internal/resources/${req.body.resourceId}`, 'resource-service');

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId: req.body.userId,
      resourceId: req.body.resourceId,
      userName: `${userRef.data?.firstName ?? 'User'} ${userRef.data?.lastName ?? ''}`.trim(),
      resourceName: resourceRef.data?.name ?? 'Resource',
      status: 'Pending',
      transactionDate: req.body.transactionDate,
      returnDate: req.body.returnDate ?? null,
      notes: req.body.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transactions.create(transaction);
    await sendNotification(transaction, { firstName: userRef.data?.firstName, lastName: userRef.data?.lastName, email: userRef.data?.email }, transaction.resourceName);
    sendSuccess(res, transaction, 'Transaction created successfully', 201);
  }),
);

app.put(
  '/api/v1/transactions/:id',
  authenticate,
  authorise('Admin', 'Staff'),
  validate(uuidParamSchema, 'params'),
  validate(updateSchema, 'body'),
  asyncHandler(async (req, res) => {
    const current = transactions.findById(req.params.id);
    if (!current) throw new AppError('Transaction not found', 404);

    if (req.body.status && req.body.status !== current.status && !validTransitions[current.status].includes(req.body.status)) {
      throw new AppError(`Invalid status transition from ${current.status} to ${req.body.status}`, 422);
    }

    const updated = transactions.updateById(req.params.id, (entry) => ({
      ...entry,
      ...(req.body.transactionDate ? { transactionDate: req.body.transactionDate } : {}),
      ...(req.body.returnDate !== undefined ? { returnDate: req.body.returnDate } : {}),
      ...(req.body.status ? { status: req.body.status } : {}),
      ...(req.body.notes !== undefined ? { notes: req.body.notes } : {}),
      updatedAt: new Date(),
    }));

    if (!updated) throw new AppError('Transaction not found', 404);
    await sendNotification(updated, {}, updated.resourceName);
    sendSuccess(res, updated, 'Transaction updated successfully');
  }),
);

app.delete(
  '/api/v1/transactions/:id',
  authenticate,
  authorise('Admin'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    if (!transactions.deleteById(req.params.id)) throw new AppError('Transaction not found', 404);
    sendSuccess(res, null, 'Transaction deleted successfully');
  }),
);

mountSwagger(app, {
  serviceName: 'transaction-service',
  spec: transactionOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  console.error('[transaction-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
