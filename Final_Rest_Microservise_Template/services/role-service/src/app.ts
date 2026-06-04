import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import {
  AppError,
  DEFAULT_IDS,
  DEFAULT_ROLE_NAMES,
  asyncHandler,
  authorise,
  buildPaginatedResult,
  createMemoryStore,
  paginationQuerySchema,
  paginate,
  sendError,
  sendSuccess,
  uuidParamSchema,
  authenticate,
  mountSwagger,
  roleOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import { z } from 'zod';

type Role = { id: string; name: string; description?: string | null; createdAt: Date; updatedAt: Date };

const roles = createMemoryStore<Role>([
  { id: DEFAULT_IDS.adminRoleId, name: DEFAULT_ROLE_NAMES.admin, description: 'Full access', createdAt: new Date(), updatedAt: new Date() },
  { id: DEFAULT_IDS.staffRoleId, name: DEFAULT_ROLE_NAMES.staff, description: 'Staff access', createdAt: new Date(), updatedAt: new Date() },
  { id: DEFAULT_IDS.userRoleId, name: DEFAULT_ROLE_NAMES.user, description: 'User access', createdAt: new Date(), updatedAt: new Date() },
]);

const createRoleSchema = z.object({ name: z.string().min(1), description: z.string().optional().nullable() });
const updateRoleSchema = createRoleSchema.partial();

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

app.get('/api/v1/roles', authenticate, authorise('Admin'), validate(paginationQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { skip, take } = paginate(page, limit);
  const items = roles.all().slice(skip, skip + take);
  sendSuccess(res, items, 'Roles retrieved successfully', 200, buildPaginatedResult(items, roles.count(), page, limit));
}));

app.get('/api/v1/roles/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  const role = roles.findById(req.params.id);
  if (!role) throw new AppError('Role not found', 404);
  sendSuccess(res, role, 'Role retrieved successfully');
}));

app.post('/api/v1/roles', authenticate, authorise('Admin'), validate(createRoleSchema, 'body'), asyncHandler(async (req, res) => {
  const role = roles.create({ id: crypto.randomUUID(), name: req.body.name, description: req.body.description ?? null, createdAt: new Date(), updatedAt: new Date() });
  sendSuccess(res, role, 'Role created successfully', 201);
}));

app.put('/api/v1/roles/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), validate(updateRoleSchema, 'body'), asyncHandler(async (req, res) => {
  const updated = roles.updateById(req.params.id, (current) => ({
    ...current,
    ...(req.body.name ? { name: req.body.name } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    updatedAt: new Date(),
  }));
  if (!updated) throw new AppError('Role not found', 404);
  sendSuccess(res, updated, 'Role updated successfully');
}));

app.delete('/api/v1/roles/:id', authenticate, authorise('Admin'), validate(uuidParamSchema, 'params'), asyncHandler(async (req, res) => {
  if (!roles.deleteById(req.params.id)) throw new AppError('Role not found', 404);
  sendSuccess(res, null, 'Role deleted successfully');
}));

mountSwagger(app, {
  serviceName: 'role-service',
  spec: roleOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) return sendError(res, err.message, err.statusCode, err.errors);
  console.error('[role-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
