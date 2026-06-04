import type { Express } from "express";
import http from "node:http";

export interface CreateServerOptions {
  onShutdown?: () => Promise<void>;
}

export function createServer(app: Express, options: CreateServerOptions = {}) {
  const server = http.createServer(app);

  const shutdown = async () => {
    server.close(async () => {
      if (options.onShutdown) {
        await options.onShutdown();
      }
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10_000).unref();
  };

  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());

  return server;
}
