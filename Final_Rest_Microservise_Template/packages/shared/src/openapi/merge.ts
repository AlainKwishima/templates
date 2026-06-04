import type { OpenApiDocument } from './types';
import { openApiComponents } from './common';

type ServiceSpecSource = {
  tag: string;
  spec: OpenApiDocument;
};

function prefixSchemaRefs(value: unknown, prefix: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => prefixSchemaRefs(entry, prefix));
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.$ref === 'string' && record.$ref.startsWith('#/components/schemas/')) {
      const name = record.$ref.replace('#/components/schemas/', '');
      return { $ref: `#/components/schemas/${prefix}_${name}` };
    }
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(record)) {
      next[key] = prefixSchemaRefs(nested, prefix);
    }
    return next;
  }
  return value;
}

export function mergeOpenApiSpecs(
  sources: ServiceSpecSource[],
  gatewayUrl: string,
): OpenApiDocument {
  const merged: OpenApiDocument = {
    openapi: '3.0.3',
    info: {
      title: 'Institution Management API',
      version: '1.0.0',
      description:
        'Aggregated OpenAPI specification for all microservices. Use the Authorize button with a JWT from POST /api/v1/auth/login.',
    },
    servers: [{ url: gatewayUrl.replace(/\/$/, ''), description: 'API Gateway' }],
    tags: [],
    paths: {},
    components: JSON.parse(JSON.stringify(openApiComponents)) as Record<string, unknown>,
    security: [{ bearerAuth: [] }],
  };

  const schemas = (merged.components!.schemas ?? {}) as Record<string, unknown>;
  const tagSet = new Set<string>();

  for (const { tag, spec } of sources) {
    tagSet.add(tag);

    for (const [name, schema] of Object.entries(
      (spec.components?.schemas as Record<string, unknown> | undefined) ?? {},
    )) {
      if (name === 'ApiSuccess' || name === 'ApiError' || name === 'PaginatedMeta') {
        continue;
      }
      schemas[`${tag}_${name}`] = prefixSchemaRefs(schema, tag);
    }

    for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
      if (path === '/health') {
        continue;
      }

      const cloned = JSON.parse(JSON.stringify(pathItem)) as Record<string, unknown>;
      for (const operation of Object.values(cloned)) {
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          const existing = Array.isArray(op.tags) ? (op.tags as string[]) : [];
          op.tags = [tag, ...existing.filter((entry) => entry !== 'Health')];
        }
      }

      merged.paths[path] = prefixSchemaRefs(cloned, tag) as Record<string, unknown>;
    }
  }

  merged.tags = Array.from(tagSet).map((name) => ({
    name,
    description: `${name} microservice endpoints`,
  }));

  merged.paths['/health'] = {
    get: {
      tags: ['Health'],
      summary: 'API Gateway health check',
      responses: {
        '200': {
          description: 'Gateway is healthy',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
            },
          },
        },
      },
    },
  };

  return merged;
}
