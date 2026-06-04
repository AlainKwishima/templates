import { createServiceSpec } from '../common';

export const notificationOpenApi = createServiceSpec({
  title: 'Notification Service API',
  description: 'Transactional email dispatch (internal)',
  tag: 'Notifications',
  port: 3007,
  paths: {
    '/api/v1/notifications/send': {
      post: {
        tags: ['Notifications'],
        summary: 'Send a notification (internal)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'type', 'subject', 'body'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  type: {
                    type: 'string',
                    enum: [
                      'welcome',
                      'email-verification',
                      'verification-success',
                      'password-reset',
                      'transaction-created',
                      'transaction-status-update',
                    ],
                  },
                  subject: { type: 'string', maxLength: 200 },
                  body: { type: 'string', maxLength: 10000 },
                  metadata: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Notification processed' } },
      },
    },
  },
});
