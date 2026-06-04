import type { AuthenticatedUser } from "@/middleware/auth.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
