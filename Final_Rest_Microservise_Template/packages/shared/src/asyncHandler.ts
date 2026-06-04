import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler =
  <TReq extends Request = Request, TRes extends Response = Response>(
    fn: (req: TReq, res: TRes, next: NextFunction) => Promise<void>,
  ): RequestHandler =>
  (req, res, next) => {
    void fn(req as TReq, res as TRes, next).catch(next);
  };

