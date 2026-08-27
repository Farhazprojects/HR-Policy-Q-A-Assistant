import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@backend/utils/errors';
import { logger } from '@backend/utils/logger';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That endpoint does not exist.' } });
}

/** Stack traces never reach the client. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(`${req.method} ${req.originalUrl}`, err.details ?? err.message);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details && process.env.NODE_ENV !== 'production' ? { details: err.details } : {}) },
    });
  }

  const isMulterLimit =
    typeof err === 'object' && err !== null && (err as { code?: string }).code === 'LIMIT_FILE_SIZE';
  if (isMulterLimit) {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'That file is too large. Please upload a smaller PDF.' },
    });
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end. Please try again — if it persists, contact your system administrator.',
    },
  });
}

/** Wraps async handlers so rejected promises reach the error handler. */
export const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
