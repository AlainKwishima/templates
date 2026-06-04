import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "@/config/env.js";

let swaggerSpec: ReturnType<typeof swaggerJSDoc> | undefined;

export function buildSwaggerSpec() {
  swaggerSpec = swaggerJSDoc({
    definition: {
      openapi: "3.1.0",
      info: {
        title: env.APP_NAME,
        version: "1.0.0",
        description: "National_Examination API",
      },
      servers: [
        {
          url: env.APP_URL,
          description: "Local server",
        },
      ],
      tags: [
        { name: "Health", description: "Readiness and liveness checks" },
        { name: "Auth", description: "Authentication and authorization" },
        { name: "Users", description: "User management" },
        { name: "Files", description: "File upload and management" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          ApiSuccess: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "OK" },
            },
          },
          ApiError: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Request failed" },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["./src/modules/**/*.ts", "./src/docs/**/*.ts"],
  });

  return swaggerSpec;
}

export const swaggerMiddleware = swaggerUi.serve;
export function swaggerHandler() {
  return swaggerUi.setup(swaggerSpec ?? buildSwaggerSpec());
}
