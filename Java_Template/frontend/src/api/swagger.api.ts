import { apiClient } from './client';
import type { OpenApiDocument } from './types';

export const swaggerApi = {
  async getOpenApiSpec(): Promise<OpenApiDocument> {
    const { data } = await apiClient.get<OpenApiDocument>('/v3/api-docs');
    return data;
  },

  getSwaggerUiUrl(): string {
    return `${apiClient.defaults.baseURL}/swagger-ui.html`;
  },

  countEndpoints(spec: OpenApiDocument): number {
    return Object.values(spec.paths).reduce((count, methods) => count + Object.keys(methods).length, 0);
  },

  listTags(spec: OpenApiDocument): string[] {
    if (spec.tags?.length) {
      return spec.tags.map((tag) => tag.name);
    }
    return [...new Set(Object.values(spec.paths).flatMap((methods) => Object.keys(methods)))];
  },
};
