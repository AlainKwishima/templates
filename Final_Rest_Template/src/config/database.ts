import { PrismaClient } from '@prisma/client';

// Extend the NodeJS global type to hold the Prisma instance across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma client singleton.
 *
 * In development, the instance is stored on the Node.js `global` object so
 * that hot-reloads (nodemon / ts-node) reuse the same connection pool instead
 * of opening a new one on every file change.
 *
 * In production a fresh instance is created once and exported directly.
 */
const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (global.__prisma ??= new PrismaClient());

export default prisma;
