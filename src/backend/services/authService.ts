import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { Unauthorized } from '@backend/utils/errors';
import { recordAudit } from './auditService';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  jobTitle: string | null;
  department: string | null;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    throw Unauthorized('Your session has expired. Please sign in again.');
  }
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
): Promise<{ user: AuthUser; token: string }> {
  const normalised = email.trim().toLowerCase();
  const record = await prisma.user.findUnique({ where: { email: normalised } });

  // Identical failure message and comparable timing whether or not the account
  // exists, so the endpoint cannot be used to enumerate valid addresses.
  const hash = record?.password ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);

  if (!record || !ok || !record.isActive) {
    await recordAudit({
      userId: record?.id,
      event: 'LOGIN_FAILED',
      metadata: { email: normalised },
      ipAddress,
    });
    throw Unauthorized('That email address or password is incorrect.');
  }

  const user: AuthUser = {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    jobTitle: record.jobTitle,
    department: record.department,
  };

  await recordAudit({ userId: user.id, event: 'LOGIN', metadata: { role: user.role }, ipAddress });
  return { user, token: signToken(user) };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const r = await prisma.user.findUnique({ where: { id } });
  if (!r || !r.isActive) return null;
  return {
    id: r.id, email: r.email, name: r.name, role: r.role,
    jobTitle: r.jobTitle, department: r.department,
  };
}
