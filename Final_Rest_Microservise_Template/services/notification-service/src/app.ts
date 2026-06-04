import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import {
  AppError,
  asyncHandler,
  createMemoryStore,
  sendError,
  sendSuccess,
  mountSwagger,
  notificationOpenApi,
} from '@shared/lib';
import { env } from './config/env';
import {
  passwordResetTemplate,
  renderTemplate,
  transactionCreatedTemplate,
  transactionStatusUpdateTemplate,
  verificationSuccessTemplate,
  welcomeEmailTemplate,
} from './templates';
import { z } from 'zod';

type Notification = {
  id: string;
  userId: string | null;
  type: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const notifications = createMemoryStore<Notification>();
const allowedTypes = [
  'welcome',
  'email-verification',
  'verification-success',
  'password-reset',
  'transaction-created',
  'transaction-status-update',
] as const;

const sendSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(allowedTypes),
  subject: z.string().max(200),
  body: z.string().max(10000),
  metadata: z.record(z.string(), z.any()).optional(),
});

const validate = (schema: z.ZodTypeAny) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    sendError(
      res,
      'Validation failed',
      400,
      result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    );
    return;
  }
  req.body = result.data;
  next();
};

async function trySendEmail(notification: Notification, metadata?: Record<string, unknown>) {
  const recipientEmail = typeof metadata?.email === 'string' ? metadata.email : `user-${notification.userId ?? 'unknown'}@example.com`;
  const recipientName = typeof metadata?.name === 'string' ? metadata.name : 'User';
  const payload = {
    sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
    to: [{ email: recipientEmail, name: recipientName }],
    subject: notification.subject,
    htmlContent: notification.body,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error('[notification-service] Brevo send failed:', notification.id, notification.userId, error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function renderNotificationTemplate(type: string, input: Record<string, string>) {
  switch (type) {
    case 'welcome':
      return renderTemplate(welcomeEmailTemplate, input);
    case 'email-verification':
      return renderTemplate(welcomeEmailTemplate, input);
    case 'verification-success':
      return renderTemplate(verificationSuccessTemplate, input);
    case 'password-reset':
      return renderTemplate(passwordResetTemplate, input);
    case 'transaction-created':
      return renderTemplate(transactionCreatedTemplate, input);
    case 'transaction-status-update':
      return renderTemplate(transactionStatusUpdateTemplate, input);
    default:
      return input.body ?? '';
  }
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }, 'ok'));

app.post(
  '/api/v1/notifications/send',
  validate(sendSchema),
  asyncHandler(async (req, res) => {
    const notification = notifications.create({
      id: crypto.randomUUID(),
      userId: req.body.userId,
      type: req.body.type,
      subject: req.body.subject,
      body: req.body.body,
      status: 'pending',
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const html = renderNotificationTemplate(req.body.type, {
      firstName: typeof req.body.metadata?.firstName === 'string' ? req.body.metadata.firstName : 'User',
      verificationLink: typeof req.body.metadata?.verificationLink === 'string' ? req.body.metadata.verificationLink : `${env.CLIENT_URL}/verify-email`,
      resetLink: typeof req.body.metadata?.resetLink === 'string' ? req.body.metadata.resetLink : `${env.CLIENT_URL}/reset-password`,
      transactionId: typeof req.body.metadata?.transactionId === 'string' ? req.body.metadata.transactionId : notification.id,
      resourceName: typeof req.body.metadata?.resourceName === 'string' ? req.body.metadata.resourceName : 'Resource',
      status: typeof req.body.metadata?.status === 'string' ? req.body.metadata.status : 'Pending',
      body: req.body.body,
    });

    notifications.updateById(notification.id, (entry) => ({ ...entry, body: html, updatedAt: new Date() }));

    const sent = await trySendEmail(notification, req.body.metadata);

    if (sent) {
      notifications.updateById(notification.id, (entry) => ({
        ...entry,
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    sendSuccess(
      res,
      { id: notification.id, emailSent: sent },
      'Notification processed successfully',
    );
  }),
);

mountSwagger(app, {
  serviceName: 'notification-service',
  spec: notificationOpenApi,
  disabled: env.DISABLE_SWAGGER === 'true',
});

app.use((_req, res) => sendError(res, 'Route not found', 404));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  console.error('[notification-service] unhandled error:', err);
  sendError(res, 'An unexpected error occurred', 500);
});

export default app;
