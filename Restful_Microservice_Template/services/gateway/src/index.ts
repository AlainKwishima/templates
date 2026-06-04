import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import { successResponse } from "@restful/shared";
import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(hpp());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

const apiPrefix = env.API_PREFIX;

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

function proxyService(target: string, servicePath: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    pathRewrite(path) {
      return `${servicePath}${path}`;
    },
    on: {
      proxyReq(proxyReq, req) {
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"] as string);
        }
      },
    },
  });
}

app.get(`${apiPrefix}/health`, async (_req, res) => {
  const services = [
    { name: "auth", url: `${env.AUTH_SERVICE_URL}${apiPrefix}/health/live` },
    { name: "users", url: `${env.USER_SERVICE_URL}${apiPrefix}/health/live` },
    { name: "files", url: `${env.FILE_SERVICE_URL}${apiPrefix}/health/live` },
  ];

  const checks = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        return { service: service.name, healthy: response.ok };
      } catch {
        return { service: service.name, healthy: false };
      }
    }),
  );

  const healthy = checks.every((check) => check.healthy);
  res.status(healthy ? 200 : 503).json(
    successResponse(healthy ? "All services healthy" : "One or more services unhealthy", {
      status: healthy ? "ok" : "degraded",
      services: checks,
      timestamp: new Date().toISOString(),
    }),
  );
});

app.use(`${apiPrefix}/auth`, proxyService(env.AUTH_SERVICE_URL, `${apiPrefix}/auth`));
app.use(`${apiPrefix}/users`, proxyService(env.USER_SERVICE_URL, `${apiPrefix}/users`));
app.use(`${apiPrefix}/files`, proxyService(env.FILE_SERVICE_URL, `${apiPrefix}/files`));

app.listen(env.PORT, env.HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`${env.APP_NAME} listening on http://${env.HOST}:${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`API docs: http://${env.HOST}:${env.PORT}/docs`);
});
