/** Errors that are safe to show to an end user. Everything else becomes a generic 500. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (m: string, d?: unknown) => new AppError(m, 400, 'BAD_REQUEST', d);
export const Unauthorized = (m = 'You need to sign in to continue.') =>
  new AppError(m, 401, 'UNAUTHORIZED');
export const Forbidden = (m = 'You do not have permission to perform this action.') =>
  new AppError(m, 403, 'FORBIDDEN');
export const NotFound = (m = 'The requested item could not be found.') =>
  new AppError(m, 404, 'NOT_FOUND');
export const PayloadTooLarge = (m: string) => new AppError(m, 413, 'PAYLOAD_TOO_LARGE');
export const TooManyRequests = (m = 'Too many requests. Please slow down.') =>
  new AppError(m, 429, 'TOO_MANY_REQUESTS');
export const ServiceUnavailable = (m: string, d?: unknown) =>
  new AppError(m, 503, 'SERVICE_UNAVAILABLE', d);
