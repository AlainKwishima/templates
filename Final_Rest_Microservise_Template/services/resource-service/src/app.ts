import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import {
  AppError,
  DEFAULT_IDS,
  asyncHandler,
  authenticate,
  authorise,
  buildPaginatedResult,
  createMemoryStore,
  paginationQuerySchema,
  paginate,
  sendError,
  sendSuccess,
  uuidParamSchema,
  mountSwagger,
  resourceOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import { z } from 'zod';

type Resource = {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  status: 'Active' | 'Inactive';
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

const resources = createMemoryStore<Resource>([
  {
    id: DEFAULT_IDS.defaultResourceId,
    name: 'Default Resource',
    description: 'Default resource',
    departmentId: DEFAULT_IDS.defaultDepartmentId,
    status: 'Active',
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  departmentId: z.string().uuid(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  quantity: z.number().int().min(0).default(0),
});
const updateResourceSchema = createResourceSchema.partial();

const validate =
  (schema: z.ZodTypeAny, target: 'body' | 'params' | 'query' = 'body') =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.get('/api/v1/resources', authenticate, validate(paginationQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { skip, take } = paginate(page, limit);
  const items = resources.all().slice(skip, skip + take);
  sendSuccess(res, items, 'Resources retrieved successfully', 200, buildPaginatedResult(items, resources.count(), page, limit));
}));

app.get('/api/v1/resources/:id', authenticate, validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  const resource = resources.findById(req.params.id);
  if (!resource) throw new AppError('Resource not found', 404);
  sendSuccess(res, resource, 'Resource retrieved successfully');
}));

app.get('/internal/resources/:id', validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  const resource = resources.findById(req.params.id);
  if (!resource) throw new AppError('Resource not found', 404);
  sendSuccess(res, resource, 'Resource retrieved successfully');
}));

app.post('/api/v1/resources', authenticate, authorise('Admin'), validate(createResourceSchema, 'body'), asyncHandler(async (req, res) => {
  const resource = resources.create({
    id: crypto.randomUUID(),
    name: req.body.name,
    description: req.body.description ?? null,
    departmentId: req.body.departmentId,
    status: req.body.status,
    quantity: req.body.quantity,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  sendSuccess(res, resource, 'Resource created successfully', 201);
}));

app.put('/api/v1/resources/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), validate(updateResourceSchema, 'body'), asyncHandler(async (req, res) => {
  const updated = resources.updateById(req.params.id, (current) => ({
    ...current,
    ...(req.body.name ? { name: req.body.name } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    ...(req.body.departmentId ? { departmentId: req.body.departmentId } : {}),
    ...(req.body.status ? { status: req.body.status } : {}),
    ...(req.body.quantity !== undefined ? { quantity: req.body.quantity } : {}),
    updatedAt: new Date(),
  }));
  if (!updated) throw new AppError('Resource not found', 404);
  sendSuccess(res, updated, 'Resource updated successfully');
}));

app.delete('/api/v1/resources/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  if (!resources.deleteById(req.params.id)) throw new AppError('Resource not found', 404);
  sendSuccess(res, null, 'Resource deleted successfully');
}));

mountSwagger(app, {
  serviceName: 'resource-service',
  spec: resourceOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) return sendError(res, err.message, err.statusCode, err.errors);
  console.error('[resource-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
