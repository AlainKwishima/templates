import type { Express } from "express";
import http from "node:http";
import { prisma } from "@/database/prisma.js";

export function createServer(app: Express) {
  const server = http.createServer(app);

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
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
