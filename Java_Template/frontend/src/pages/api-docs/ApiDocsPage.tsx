import { swaggerApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { API_BASE_URL } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import styles from './ApiDocsPage.module.css';

export function ApiDocsPage() {
  const { data: spec, isLoading, error } = useQuery({
    queryKey: ['openapi'],
    queryFn: () => swaggerApi.getOpenApiSpec(),
  });

  const swaggerUrl = swaggerApi.getSwaggerUiUrl();
  const endpointCount = spec ? swaggerApi.countEndpoints(spec) : 0;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">API Documentation</h1>
          <p className="page-description">
            OpenAPI spec integration and Swagger UI access
          </p>
        </div>
        <a href={swaggerUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">
            <ExternalLink size={16} />
            Open Swagger UI
          </Button>
        </a>
      </header>

      {isLoading ? (
        <SkeletonCard />
      ) : error ? (
        <Card>
          <CardContent>
            <p className={styles.error}>
              Could not load OpenAPI spec. Make sure the backend is running at {API_BASE_URL}.
            </p>
          </CardContent>
        </Card>
      ) : spec ? (
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <CardTitle>{spec.info.title}</CardTitle>
              <CardDescription>Version {spec.info.version}</CardDescription>
            </CardHeader>
            <CardContent>
              {spec.info.description ? (
                <p className={styles.description}>{spec.info.description}</p>
              ) : null}
              <dl className={styles.dl}>
                <div>
                  <dt>OpenAPI</dt>
                  <dd>{spec.openapi}</dd>
                </div>
                <div>
                  <dt>Endpoints</dt>
                  <dd>{endpointCount}</dd>
                </div>
                <div>
                  <dt>Base URL</dt>
                  <dd>{API_BASE_URL}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available paths</CardTitle>
              <CardDescription>Endpoints from the OpenAPI specification</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className={styles.paths}>
                {Object.entries(spec.paths).map(([path, methods]) =>
                  Object.keys(methods).map((method) => (
                    <li key={`${method}-${path}`} className={styles.pathItem}>
                      <span className={styles.method}>{method.toUpperCase()}</span>
                      <code className={styles.path}>{path}</code>
                    </li>
                  )),
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
