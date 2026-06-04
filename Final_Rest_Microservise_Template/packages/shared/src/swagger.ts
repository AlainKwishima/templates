import type { Express, RequestHandler } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { OpenApiDocument } from './openapi/types';

export type MountSwaggerOptions = {
  serviceName: string;
  spec: OpenApiDocument;
  disabled?: boolean;
};

const swaggerHelmet = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}) as RequestHandler;

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Not found', data: null });
};

export function mountSwagger(app: Express, options: MountSwaggerOptions): void {
  if (options.disabled) {
    app.get('/api-docs', notFoundHandler);
    app.get('/api-docs.json', notFoundHandler);
    return;
  }

  const spec: OpenApiDocument = {
    ...options.spec,
    info: {
      ...options.spec.info,
      title: options.spec.info.title || options.serviceName,
    },
  };

  app.get('/api-docs.json', swaggerHelmet, (_req, res) => {
    res.json(spec);
  });

  app.use(
    '/api-docs',
    swaggerHelmet,
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: `${options.serviceName} API`,
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}

export { mergeOpenApiSpecs } from './openapi/merge';
