import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import {
  AppError,
  DEFAULT_IDS,
  DEFAULT_ROLE_NAMES,
  asyncHandler,
  createMemoryStore,
  emailSchema,
  passwordSchema,
  requestJson,
  sendError,
  sendSuccess,
  mountSwagger,
  authOpenApi,
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
  verificationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
type RefreshToken = { id: string; userId: string; token: string; expiresAt: Date; createdAt: Date };

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

const refreshTokens = createMemoryStore<RefreshToken>();

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: emailSchema,
  password: passwordSchema,
});
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
const verifyEmailSchema = z.object({ token: z.string().min(1) });
const forgotPasswordSchema = z.object({ email: emailSchema });
const resetPasswordSchema = z.object({ token: z.string().min(1), password: passwordSchema });
const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const signAccessToken = (payload: { userId: string; email: string; role: string }) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
const generateToken = () => crypto.randomUUID();

function validationMiddleware(schema: z.ZodTypeAny) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(
        res,
        'Validation failed',
        400,
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

async function notify(type: string, userId: string, subject: string, body: string) {
  if (!env.NOTIFICATION_SERVICE_URL) {
    return;
  }

  void requestJson(`${env.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
    method: 'POST',
    timeoutMs: 5000,
    serviceName: 'notification-service',
    body: { userId, type, subject, body },
  }).catch((error) => {
    console.warn('[auth-service] notification handoff failed:', error instanceof Error ? error.message : error);
  });
}

function currentRole(roleId: string) {
  return roles.findById(roleId)?.name ?? DEFAULT_ROLE_NAMES.user;
}

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.post(
  '/api/v1/auth/register',
  validationMiddleware(registerSchema),
  asyncHandler(async (req, res) => {
    const existing = users.findOne((user) => user.email === req.body.email);
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const user = users.create({
      id: crypto.randomUUID(),
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      roleId: DEFAULT_IDS.userRoleId,
      isVerified: false,
      verificationToken: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await notify(
      'welcome',
      user.id,
      'Welcome to the platform',
      `Welcome ${user.firstName}, please verify your email.`,
    );

    sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: currentRole(user.roleId),
        isVerified: user.isVerified,
      },
      'User registered successfully',
      201,
    );
  }),
);

app.post(
  '/api/v1/auth/verify-email',
  validationMiddleware(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const user = users.findOne((entry) => entry.verificationToken === req.body.token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    users.updateById(user.id, (entry) => ({
      ...entry,
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date(),
    }));

    await notify('verification-success', user.id, 'Email verified', 'Your email has been verified.');
    sendSuccess(res, null, 'Email verified successfully');
  }),
);

app.post(
  '/api/v1/auth/login',
  validationMiddleware(loginSchema),
  asyncHandler(async (req, res) => {
    const user = users.findOne((entry) => entry.email === req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload = { userId: user.id, email: user.email, role: currentRole(user.roleId) };
    const accessToken = signAccessToken(payload);
    const refreshToken = crypto.randomUUID();
    refreshTokens.create({
      id: crypto.randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    await notify('welcome', user.id, 'Login successful', 'You have signed in successfully.');
    sendSuccess(res, { accessToken, refreshToken }, 'Login successful');
  }),
);

app.post(
  '/api/v1/auth/logout',
  validationMiddleware(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const record = refreshTokens.findOne((entry) => entry.token === req.body.refreshToken);
    if (record) {
      refreshTokens.deleteById(record.id);
    }
    sendSuccess(res, null, 'Logged out successfully');
  }),
);

app.post(
  '/api/v1/auth/forgot-password',
  validationMiddleware(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = users.findOne((entry) => entry.email === req.body.email);
    if (user) {
      const resetToken = crypto.randomUUID();
      users.updateById(user.id, (entry) => ({
        ...entry,
        resetPasswordToken: hashToken(resetToken),
        resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000),
        updatedAt: new Date(),
      }));
      await notify('password-reset', user.id, 'Password reset', `Reset token: ${resetToken}`);
    }
    sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  }),
);

app.post(
  '/api/v1/auth/reset-password',
  validationMiddleware(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const tokenHash = hashToken(req.body.token);
    const user = users.findOne(
      (entry) =>
        entry.resetPasswordToken === tokenHash &&
        !!entry.resetPasswordExpiry &&
        entry.resetPasswordExpiry.getTime() > Date.now(),
    );
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    users.updateById(user.id, (entry) => ({
      ...entry,
      password: bcrypt.hashSync(req.body.password, 10),
      resetPasswordToken: null,
      resetPasswordExpiry: null,
      updatedAt: new Date(),
    }));

    sendSuccess(res, null, 'Password reset successfully');
  }),
);

app.post(
  '/api/v1/auth/refresh-token',
  validationMiddleware(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const record = refreshTokens.findOne((entry) => entry.token === req.body.refreshToken);
    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = users.findById(record.userId);
    if (!user) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    refreshTokens.deleteById(record.id);
    const refreshToken = crypto.randomUUID();
    refreshTokens.create({
      id: crypto.randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    sendSuccess(
      res,
      {
        accessToken: signAccessToken({
          userId: user.id,
          email: user.email,
          role: currentRole(user.roleId),
        }),
        refreshToken,
      },
      'Token refreshed successfully',
    );
  }),
);

mountSwagger(app, {
  serviceName: 'auth-service',
  spec: authOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  console.error('[auth-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
