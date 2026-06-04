import { bearerSecurity, createServiceSpec } from '../common';

const departmentBody = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
  },
};

const op = (summary: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Departments'],
  summary,
  security: bearerSecurity,
  ...extra,
});

export const departmentOpenApi = createServiceSpec({
  title: 'Department Service API',
  description: 'Department CRUD',
  tag: 'Departments',
  port: 3004,
  paths: {
    '/api/v1/departments': {
      get: {
        ...op('List departments'),
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: { '200': { description: 'Departments retrieved' } },
      },
      post: {
        ...op('Create department (Admin)'),
        requestBody: { required: true, content: { 'application/json': { schema: departmentBody } } },
        responses: { '201': { description: 'Department created' } },
      },
    },
    '/api/v1/departments/{id}': {
      get: {
        ...op('Get department by ID'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } },
      },
      put: {
        ...op('Update department (Admin)'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { content: { 'application/json': { schema: departmentBody } } },
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        ...op('Delete department (Admin)'),
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Deleted' } },
      },
    },
  },
});
