import type { AuditEvent, Prisma } from '@prisma/client';
import { prisma } from '@db/client';
import { logger } from '@backend/utils/logger';

/**
 * Audit logging never blocks the user-facing request: a logging failure is
 * recorded to the console rather than surfaced as an error.
 * Only non-sensitive metadata is stored (see docs/AI_GOVERNANCE.md).
 */
export async function recordAudit(params: {
  userId?: string | null;
  event: AuditEvent;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        event: params.event,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  } catch (e) {
    logger.warn('Audit log write failed', e instanceof Error ? e.message : e);
  }
}
