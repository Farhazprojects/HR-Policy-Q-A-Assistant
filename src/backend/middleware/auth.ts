import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { getUserById, verifyToken, type AuthUser } from '@backend/services/authService';
import { recordAudit } from '@backend/services/auditService';
import { Forbidden, Unauthorized } from '@backend/utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Accepts the httpOnly cookie set at login, or a Bearer token (used by tests). */
function extractToken(req: Request): string | null {
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
  if (cookie) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw Unauthorized();
    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user) throw Unauthorized('Your account is no longer active.');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Role-based access control. Denials are audited. */
export function requireRole(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) {
      await recordAudit({
        userId: req.user.id,
        event: 'ACCESS_DENIED',
        metadata: { path: req.originalUrl, required: roles, actual: req.user.role },
        ipAddress: req.ip,
      });
      return next(
        Forbidden(
          `This area is restricted to ${roles.map(labelForRole).join(' and ')} accounts. Your account has ${labelForRole(req.user.role)} access.`,
        ),
      );
    }
    return next();
  };
}

const labelForRole = (r: Role): string =>
  r === 'HR_OFFICER' ? 'HR Officer' : r === 'ADMIN' ? 'Administrator' : 'Employee';

/** HR Officers inherit every employee capability; Admins inherit both. */
export const requireHR = requireRole('HR_OFFICER', 'ADMIN');
export const requireAdmin = requireRole('ADMIN');
