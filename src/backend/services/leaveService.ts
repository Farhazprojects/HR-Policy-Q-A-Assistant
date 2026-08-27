import type { LeaveType } from '@prisma/client';
import { prisma } from '@db/client';
import { BadRequest, NotFound } from '@backend/utils/errors';
import { recordAudit } from './auditService';

/** Whole days inclusive of both endpoints. Calendar days, not business days —
 *  business-rule calculation is out of prototype scope and is labelled as such. */
export function calculateDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export async function createLeaveRequest(params: {
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  ipAddress?: string;
}) {
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  if (Number.isNaN(start.getTime())) throw BadRequest('Please provide a valid start date.');
  if (Number.isNaN(end.getTime())) throw BadRequest('Please provide a valid end date.');
  if (end < start) throw BadRequest('The end date cannot be before the start date.');

  const reason = params.reason.trim();
  if (reason.length < 3) throw BadRequest('Please give a brief reason for your leave request.');
  if (reason.length > 500) throw BadRequest('Please shorten your reason to 500 characters or fewer.');

  const totalDays = calculateDays(start, end);
  if (totalDays > 365) throw BadRequest('A single request cannot exceed 365 days.');

  const request = await prisma.leaveRequest.create({
    data: {
      userId: params.userId,
      leaveType: params.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'SUBMITTED',
    },
  });

  await recordAudit({
    userId: params.userId,
    event: 'LEAVE_REQUEST',
    entity: 'LeaveRequest',
    entityId: request.id,
    metadata: { leaveType: params.leaveType, totalDays },
    ipAddress: params.ipAddress,
  });

  return request;
}

export async function listLeaveRequests(userId: string) {
  return prisma.leaveRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function getLeaveRequest(id: string, userId: string) {
  const r = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!r || r.userId !== userId) throw NotFound('That leave request could not be found.');
  return r;
}
