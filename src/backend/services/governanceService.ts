import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { getLLMProvider } from '@ai/llm-providers/llm';

/**
 * Every figure below is computed from the database. Nothing is hard-coded.
 * `demoDataPresent` tells the interface to label seeded rows as DEMO DATA.
 */
export async function getGovernanceMetrics() {
  const [
    policiesIndexed,
    policiesTotal,
    demoPolicies,
    totalQuestions,
    groundedAnswers,
    fallbacks,
    errorAnswers,
    similarityAgg,
    confidenceAgg,
    lowConfidence,
    users,
    acknowledgementTotal,
    acknowledgementDone,
    leaveRequests,
    auditCount,
  ] = await Promise.all([
    prisma.policyDocument.count({ where: { status: 'INDEXED' } }),
    prisma.policyDocument.count(),
    prisma.policyDocument.count({ where: { isDemo: true } }),
    prisma.question.count(),
    prisma.question.count({ where: { status: 'GROUNDED' } }),
    prisma.question.count({ where: { status: 'FALLBACK' } }),
    prisma.question.count({ where: { status: 'ERROR' } }),
    prisma.question.aggregate({ _avg: { topSimilarity: true }, where: { status: 'GROUNDED' } }),
    prisma.question.aggregate({ _avg: { confidence: true }, where: { status: 'GROUNDED' } }),
    prisma.question.count({ where: { status: 'GROUNDED', confidenceBand: 'LOW' } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.policyAcknowledgement.count(),
    prisma.policyAcknowledgement.count({ where: { acknowledgedAt: { not: null } } }),
    prisma.leaveRequest.count(),
    prisma.auditLog.count(),
  ]);

  const chunkCount = await prisma.policyChunk.count();
  const embeddingProvider = getEmbeddingProvider();
  const llmProvider = getLLMProvider();

  const groundingRate = totalQuestions === 0 ? 0 : groundedAnswers / totalQuestions;
  const fallbackRate = totalQuestions === 0 ? 0 : fallbacks / totalQuestions;

  return {
    knowledgeBase: {
      policiesIndexed,
      policiesTotal,
      chunkCount,
      demoPolicies,
    },
    ai: {
      totalQuestions,
      groundedAnswers,
      fallbacks,
      errorAnswers,
      groundingRate,
      fallbackRate,
      lowConfidenceAnswers: lowConfidence,
      averageTopSimilarity: similarityAgg._avg.topSimilarity ?? 0,
      averageConfidence: confidenceAgg._avg.confidence ?? 0,
    },
    retrieval: {
      threshold: env.rag.threshold,
      topK: env.rag.topK,
      similarityFunction: embeddingProvider.similarityFunction,
      embeddingProvider: embeddingProvider.id,
      embeddingModel: embeddingProvider.model,
      isNeuralEmbedding: embeddingProvider.isNeural,
    },
    generation: {
      provider: llmProvider.id,
      model: llmProvider.model,
      isGenerative: llmProvider.isGenerative,
      demoMode: env.demoMode,
    },
    accessControl: {
      roles: users.map((u) => ({ role: u.role, count: u._count._all })),
      totalUsers: users.reduce((n, u) => n + u._count._all, 0),
    },
    activity: {
      acknowledgementTotal,
      acknowledgementDone,
      acknowledgementRate: acknowledgementTotal === 0 ? 0 : acknowledgementDone / acknowledgementTotal,
      leaveRequests,
      auditEvents: auditCount,
    },
    demoDataPresent: demoPolicies > 0,
    generatedAt: new Date().toISOString(),
  };
}

export async function getRecentActivity(limit = 25) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, role: true } } },
  });
  return logs.map((l) => ({
    id: l.id,
    event: l.event,
    entity: l.entity,
    entityId: l.entityId,
    metadata: l.metadata,
    createdAt: l.createdAt,
    actor: l.user ? { name: l.user.name, role: l.user.role } : null,
  }));
}

export async function getHrDashboard() {
  const [policiesIndexed, questions, ackTotal, ackDone, confidenceAgg, recentUploads, recentQuestions] =
    await Promise.all([
      prisma.policyDocument.count({ where: { status: 'INDEXED' } }),
      prisma.question.count(),
      prisma.policyAcknowledgement.count(),
      prisma.policyAcknowledgement.count({ where: { acknowledgedAt: { not: null } } }),
      prisma.question.aggregate({ _avg: { confidence: true }, where: { status: 'GROUNDED' } }),
      prisma.policyDocument.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, version: true, status: true, pageCount: true, chunkCount: true, createdAt: true, isDemo: true },
      }),
      prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, question: true, status: true, confidence: true, createdAt: true, user: { select: { name: true } } },
      }),
    ]);

  return {
    metrics: {
      policiesIndexed,
      questions,
      acknowledgementRate: ackTotal === 0 ? 0 : ackDone / ackTotal,
      acknowledgementTotal: ackTotal,
      acknowledgementDone: ackDone,
      averageConfidence: confidenceAgg._avg.confidence ?? 0,
    },
    recentUploads,
    recentQuestions,
  };
}
