import { Router } from 'express';
import { prisma } from '@db/client';
import { requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';

const router = Router();
router.use(requireAuth);

/** Data behind the Employee Dashboard cards — all live queries. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [pendingAcks, completedAcks, recentQuestion, policiesIndexed, leaveCount, lastAck] =
      await Promise.all([
        prisma.policyAcknowledgement.count({ where: { userId, acknowledgedAt: null } }),
        prisma.policyAcknowledgement.count({ where: { userId, acknowledgedAt: { not: null } } }),
        prisma.question.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: { citations: { orderBy: { rank: 'asc' }, take: 1 } },
        }),
        prisma.policyDocument.count({ where: { status: 'INDEXED' } }),
        prisma.leaveRequest.count({ where: { userId } }),
        prisma.policyAcknowledgement.findFirst({
          where: { userId, acknowledgedAt: { not: null } },
          orderBy: { acknowledgedAt: 'desc' },
          include: { document: { select: { title: true } } },
        }),
      ]);

    return res.json({
      pendingAcknowledgements: pendingAcks,
      completedAcknowledgements: completedAcks,
      policiesIndexed,
      leaveRequests: leaveCount,
      recentQuestion: recentQuestion
        ? {
            id: recentQuestion.id,
            question: recentQuestion.question,
            status: recentQuestion.status,
            confidence: recentQuestion.confidence,
            createdAt: recentQuestion.createdAt,
            topCitation: recentQuestion.citations[0]
              ? {
                  documentTitle: recentQuestion.citations[0].documentTitle,
                  page: recentQuestion.citations[0].page,
                  section: recentQuestion.citations[0].section,
                }
              : null,
          }
        : null,
      lastAcknowledgement: lastAck
        ? { title: lastAck.document.title, acknowledgedAt: lastAck.acknowledgedAt }
        : null,
    });
  }),
);

export default router;
