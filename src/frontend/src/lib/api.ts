export interface ApiError {
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * All requests go to the same origin and are proxied to the Express API by
 * next.config.mjs, so the httpOnly session cookie is sent automatically and no
 * token is ever readable from JavaScript.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      'Could not reach the server. Check that the API is running, then try again.',
      'NETWORK_ERROR',
      0,
    );
  }

  if (res.status === 204) return undefined as T;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiRequestError('The server returned an unexpected response.', 'BAD_RESPONSE', res.status);
    }
    return undefined as T;
  }

  if (!res.ok) {
    const err = (body as { error?: ApiError }).error;
    throw new ApiRequestError(
      err?.message ?? 'Something went wrong. Please try again.',
      err?.code ?? 'UNKNOWN',
      res.status,
    );
  }
  return body as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
