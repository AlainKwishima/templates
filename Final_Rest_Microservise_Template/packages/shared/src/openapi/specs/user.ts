import { bearerSecurity, createServiceSpec } from '../common';

const userSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    roleId: { type: 'string', format: 'uuid' },
  },
};

const crud = (summary: string, method: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Users'],
  summary,
  security: bearerSecurity,
  ...extra,
});

export const userOpenApi = createServiceSpec({
  title: 'User Service API',
  description: 'Admin user management',
  tag: 'Users',
  port: 3002,
  paths: {
    '/api/v1/users': {
      get: {
        ...crud('List users (paginated)', 'get'),
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: { '200': { description: 'Users retrieved' }, '401': { description: 'Unauthorized' } },
      },
      post: {
        ...crud('Create user', 'post'),
        requestBody: { required: true, content: { 'application/json': { schema: userSchema } } },
        responses: { '201': { description: 'User created' }, '409': { description: 'Email exists' } },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        ...crud('Get user by ID', 'get'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'User found' }, '404': { description: 'Not found' } },
      },
      put: {
        ...crud('Update user', 'put'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { content: { 'application/json': { schema: userSchema } } },
        responses: { '200': { description: 'User updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        ...crud('Delete user', 'delete'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'User deleted' }, '404': { description: 'Not found' } },
      },
    },
    '/internal/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Internal: get user by ID (service-to-service)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'User found' }, '404': { description: 'Not found' } },
      },
    },
  },
});
