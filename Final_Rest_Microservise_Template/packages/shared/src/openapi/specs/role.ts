import { bearerSecurity, createServiceSpec } from '../common';

const roleBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
  },
};

const adminOp = (summary: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Roles'],
  summary,
  security: bearerSecurity,
  ...extra,
});

export const roleOpenApi = createServiceSpec({
  title: 'Role Service API',
  description: 'Role CRUD (Admin)',
  tag: 'Roles',
  port: 3003,
  paths: {
    '/api/v1/roles': {
      get: {
        ...adminOp('List roles'),
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: { '200': { description: 'Roles retrieved' } },
      },
      post: {
        ...adminOp('Create role'),
        requestBody: { required: true, content: { 'application/json': { schema: roleBody } } },
        responses: { '201': { description: 'Role created' } },
      },
    },
    '/api/v1/roles/{id}': {
      get: {
        ...adminOp('Get role by ID'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Role found' }, '404': { description: 'Not found' } },
      },
      put: {
        ...adminOp('Update role'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { content: { 'application/json': { schema: roleBody } } },
        responses: { '200': { description: 'Role updated' } },
      },
      delete: {
        ...adminOp('Delete role'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Role deleted' } },
      },
    },
  },
});
