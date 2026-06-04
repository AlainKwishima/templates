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
  departmentOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import { z } from 'zod';

type Department = { id: string; name: string; description?: string | null; createdAt: Date; updatedAt: Date };
const departments = createMemoryStore<Department>([
  { id: DEFAULT_IDS.defaultDepartmentId, name: 'General Studies', description: 'Default department', createdAt: new Date(), updatedAt: new Date() },
]);

const createDepartmentSchema = z.object({ name: z.string().min(1), description: z.string().optional().nullable() });
const updateDepartmentSchema = createDepartmentSchema.partial();

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

app.get('/api/v1/departments', authenticate, validate(paginationQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { skip, take } = paginate(page, limit);
  const items = departments.all().slice(skip, skip + take);
  sendSuccess(res, items, 'Departments retrieved successfully', 200, buildPaginatedResult(items, departments.count(), page, limit));
}));

app.get('/api/v1/departments/:id', authenticate, validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  const department = departments.findById(req.params.id);
  if (!department) throw new AppError('Department not found', 404);
  sendSuccess(res, department, 'Department retrieved successfully');
}));

app.post('/api/v1/departments', authenticate, authorise('Admin'), validate(createDepartmentSchema, 'body'), asyncHandler(async (req, res) => {
  const department = departments.create({ id: crypto.randomUUID(), name: req.body.name, description: req.body.description ?? null, createdAt: new Date(), updatedAt: new Date() });
  sendSuccess(res, department, 'Department created successfully', 201);
}));

app.put('/api/v1/departments/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), validate(updateDepartmentSchema, 'body'), asyncHandler(async (req, res) => {
  const updated = departments.updateById(req.params.id, (current) => ({
    ...current,
    ...(req.body.name ? { name: req.body.name } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    updatedAt: new Date(),
  }));
  if (!updated) throw new AppError('Department not found', 404);
  sendSuccess(res, updated, 'Department updated successfully');
}));

app.delete('/api/v1/departments/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  if (!departments.deleteById(req.params.id)) throw new AppError('Department not found', 404);
  sendSuccess(res, null, 'Department deleted successfully');
}));

mountSwagger(app, {
  serviceName: 'department-service',
  spec: departmentOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) return sendError(res, err.message, err.statusCode, err.errors);
  console.error('[department-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
