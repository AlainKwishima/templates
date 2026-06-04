import type { OpenApiDocument } from './types';

export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  schemas: {
    ApiSuccess: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        data: { nullable: true },
      },
    },
    ApiError: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        data: { type: 'null', nullable: true },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    PaginatedMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
  parameters: {
    Page: {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    Limit: {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    },
    IdParam: {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
  },
};

export const bearerSecurity = [{ bearerAuth: [] }];

export const healthPath = {
  get: {
    tags: ['Health'],
    summary: 'Service health check',
    responses: {
      '200': {
        description: 'Service is healthy',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiSuccess' },
          },
        },
      },
    },
  },
};

export function createServiceSpec(options: {
  title: string;
  description: string;
  tag: string;
  port: number;
  paths: OpenApiDocument['paths'];
}): OpenApiDocument {
  return {
    openapi: '3.0.3',
    info: {
      title: options.title,
      version: '1.0.0',
      description: options.description,
    },
    servers: [{ url: `http://localhost:${options.port}`, description: `${options.tag} (direct)` }],
    tags: [{ name: options.tag, description: options.description }],
    paths: {
      '/health': healthPath,
      ...options.paths,
    },
    components: openApiComponents,
  };
}
