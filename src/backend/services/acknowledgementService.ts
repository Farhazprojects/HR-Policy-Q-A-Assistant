import { prisma } from '@db/client';
import { BadRequest, NotFound } from '@backend/utils/errors';
import { recordAudit } from './auditService';

export async function listAcknowledgements(userId: string) {
  const rows = await prisma.policyAcknowledgement.findMany({
    where: { userId },
    orderBy: [{ acknowledgedAt: 'asc' }, { assignedAt: 'desc' }],
    include: {
      document: {
        select: { id: true, title: true, category: true, version: true, summary: true, isDemo: true },
      },
    },
  });

  return {
    pending: rows.filter((r) => !r.acknowledgedAt),
    completed: rows.filter((r) => r.acknowledgedAt),
    completedCount: rows.filter((r) => r.acknowledgedAt).length,
    pendingCount: rows.filter((r) => !r.acknowledgedAt).length,
  };
}

export async function acknowledgePolicy(params: {
  userId: string;
  documentId: string;
  ipAddress?: string;
}) {
  const assignment = await prisma.policyAcknowledgement.findFirst({
    where: { userId: params.userId, documentId: params.documentId },
    include: { document: { select: { title: true, version: true } } },
  });

  if (!assignment) {
    throw NotFound('That policy has not been assigned to you for acknowledgement.');
  }
  if (assignment.acknowledgedAt) {
    throw BadRequest('You have already acknowledged this policy.');
  }

  const updated = await prisma.policyAcknowledgement.update({
    where: { id: assignment.id },
    data: { acknowledgedAt: new Date() },
    include: { document: { select: { id: true, title: true, version: true, category: true } } },
  });

  await recordAudit({
    userId: params.userId,
    event: 'POLICY_ACKNOWLEDGED',
    entity: 'PolicyDocument',
    entityId: params.documentId,
    metadata: { title: assignment.document.title, version: assignment.policyVersion },
    ipAddress: params.ipAddress,
  });

  return updated;
}

/** Assigns every acknowledgement-required policy to a user, skipping existing rows. */
export async function assignRequiredPolicies(userId: string): Promise<number> {
  const policies = await prisma.policyDocument.findMany({
    where: { requiresAcknowledgement: true, status: 'INDEXED' },
    select: { id: true, version: true },
  });
  let created = 0;
  for (const p of policies) {
    const exists = await prisma.policyAcknowledgement.findUnique({
      where: {
        userId_documentId_policyVersion: {
          userId, documentId: p.id, policyVersion: p.version,
        },
      },
    });
    if (!exists) {
      await prisma.policyAcknowledgement.create({
        data: { userId, documentId: p.id, policyVersion: p.version },
      });
      created += 1;
    }
  }
  return created;
}
