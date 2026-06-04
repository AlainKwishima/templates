export * from './asyncHandler';
export * from './auth';
export * from './errors';
export * from './http';
export * from './env';
export * from './pagination';
export * from './memory';
export * from './response';
export * from './schemas';
export * from './seed';
export * from './swagger';
export * from './openapi';
export * from './types';

import type { JwtPayload } from './types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
