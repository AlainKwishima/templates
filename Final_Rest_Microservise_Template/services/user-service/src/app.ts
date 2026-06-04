import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
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
  passwordSchema,
  paginate,
  sendError,
  sendSuccess,
  uuidParamSchema,
  authenticate,
  mountSwagger,
  userOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import { z } from 'zod';

type Role = { id: string; name: string };
type User = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const roles = createMemoryStore<Role>([
  { id: DEFAULT_IDS.adminRoleId, name: DEFAULT_ROLE_NAMES.admin },
  { id: DEFAULT_IDS.staffRoleId, name: DEFAULT_ROLE_NAMES.staff },
  { id: DEFAULT_IDS.userRoleId, name: DEFAULT_ROLE_NAMES.user },
]);

const users = createMemoryStore<User>([
  {
    id: DEFAULT_IDS.adminUserId,
    email: 'admin@institution.local',
    password: bcrypt.hashSync('Admin123!', 10),
    firstName: 'System',
    lastName: 'Admin',
    roleId: DEFAULT_IDS.adminRoleId,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  roleId: z.string().uuid(),
});
const updateUserSchema = createUserSchema.partial();

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

const toPublic = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roleId: user.roleId,
  role: roles.findById(user.roleId)?.name ?? DEFAULT_ROLE_NAMES.user,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.get(
  '/api/v1/users',
  authenticate,
  authorise('Admin'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const { skip, take } = paginate(page, limit);
    const items = users.all().slice(skip, skip + take).map(toPublic);
    sendSuccess(res, items, 'Users retrieved successfully', 200, buildPaginatedResult(items, users.count(), page, limit));
  }),
);

app.get(
  '/api/v1/users/:id',
  authenticate,
  authorise('Admin'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const user = users.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, toPublic(user), 'User retrieved successfully');
  }),
);

app.get(
  '/internal/users/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const user = users.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, toPublic(user), 'User retrieved successfully');
  }),
);

app.post(
  '/api/v1/users',
  authenticate,
  authorise('Admin'),
  validate(createUserSchema, 'body'),
  asyncHandler(async (req, res) => {
    if (users.findOne((user) => user.email === req.body.email)) {
      throw new AppError('Email is already registered', 409);
    }
    if (!roles.findById(req.body.roleId)) {
      throw new AppError('Role not found', 404);
    }
    const user = users.create({
      id: crypto.randomUUID(),
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      roleId: req.body.roleId,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sendSuccess(res, toPublic(user), 'User created successfully', 201);
  }),
);

app.put(
  '/api/v1/users/:id',
  authenticate,
  authorise('Admin'),
  validate(uuidParamSchema, 'params'),
  validate(updateUserSchema, 'body'),
  asyncHandler(async (req, res) => {
    const updated = users.updateById(req.params.id, (current) => ({
      ...current,
      ...(req.body.firstName ? { firstName: req.body.firstName } : {}),
      ...(req.body.lastName ? { lastName: req.body.lastName } : {}),
      ...(req.body.email ? { email: req.body.email } : {}),
      ...(req.body.password ? { password: bcrypt.hashSync(req.body.password, 10) } : {}),
      ...(req.body.roleId ? { roleId: req.body.roleId } : {}),
      updatedAt: new Date(),
    }));
    if (!updated) throw new AppError('User not found', 404);
    sendSuccess(res, toPublic(updated), 'User updated successfully');
  }),
);

app.delete(
  '/api/v1/users/:id',
  authenticate,
  authorise('Admin'),
  validate(uuidParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    if (!users.deleteById(req.params.id)) throw new AppError('User not found', 404);
    sendSuccess(res, null, 'User deleted successfully');
  }),
);

mountSwagger(app, {
  serviceName: 'user-service',
  spec: userOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  console.error('[user-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
