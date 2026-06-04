import { bearerSecurity, createServiceSpec } from '../common';

const transactionBody = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    resourceId: { type: 'string', format: 'uuid' },
    transactionDate: { type: 'string', format: 'date-time' },
    returnDate: { type: 'string', format: 'date-time', nullable: true },
    notes: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['Pending', 'Active', 'Completed', 'Cancelled'] },
  },
};

const op = (summary: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Transactions'],
  summary,
  security: bearerSecurity,
  ...extra,
});

export const transactionOpenApi = createServiceSpec({
  title: 'Transaction Service API',
  description: 'Transaction lifecycle and status transitions',
  tag: 'Transactions',
  port: 3006,
  paths: {
    '/api/v1/transactions': {
      get: {
        ...op('List transactions'),
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: { '200': { description: 'Transactions retrieved' } },
      },
      post: {
        ...op('Create transaction (Admin/Staff)'),
        requestBody: { required: true, content: { 'application/json': { schema: transactionBody } } },
        responses: { '201': { description: 'Created' }, '422': { description: 'Invalid user or resource' } },
      },
    },
    '/api/v1/transactions/{id}': {
      get: {
        ...op('Get transaction by ID'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } },
      },
      put: {
        ...op('Update transaction / change status'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { content: { 'application/json': { schema: transactionBody } } },
        responses: { '200': { description: 'Updated' }, '400': { description: 'Invalid transition' } },
      },
      delete: {
        ...op('Delete transaction (Admin)'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
  },
});
