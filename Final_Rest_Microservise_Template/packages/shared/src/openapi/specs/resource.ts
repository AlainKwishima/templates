import { bearerSecurity, createServiceSpec } from '../common';

const resourceBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    departmentId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['Active', 'Inactive'] },
    quantity: { type: 'integer', minimum: 0 },
  },
};

const op = (summary: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Resources'],
  summary,
  security: bearerSecurity,
  ...extra,
});

export const resourceOpenApi = createServiceSpec({
  title: 'Resource Service API',
  description: 'Resource inventory CRUD',
  tag: 'Resources',
  port: 3005,
  paths: {
    '/api/v1/resources': {
      get: {
        ...op('List resources'),
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: { '200': { description: 'Resources retrieved' } },
      },
      post: {
        ...op('Create resource (Admin)'),
        requestBody: { required: true, content: { 'application/json': { schema: resourceBody } } },
        responses: { '201': { description: 'Resource created' } },
      },
    },
    '/api/v1/resources/{id}': {
      get: {
        ...op('Get resource by ID'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } },
      },
      put: {
        ...op('Update resource (Admin)'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { content: { 'application/json': { schema: resourceBody } } },
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        ...op('Delete resource (Admin)'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
    '/internal/resources/{id}': {
      get: {
        tags: ['Resources'],
        summary: 'Internal: get resource by ID (service-to-service)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } },
      },
    },
  },
});
