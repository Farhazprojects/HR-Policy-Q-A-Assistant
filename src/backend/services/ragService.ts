import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { getActiveThreshold, resolveEmbeddingProvider } from '@ai/llm-providers/embedding';
import type { EmbeddingProvider } from '@ai/llm-providers/embedding';
import { resolveLLMProvider } from '@ai/llm-providers/llm';
import type { RetrievedContext } from '@ai/llm-providers/llm';
import { calculateConfidence } from '@ai/evaluation/confidence';
import { FALLBACK_ANSWER, GROUNDING_SYSTEM_PROMPT } from '@ai/prompt-management/prompt';
import { vectorStore, type SearchHit } from '@ai/vector-store/vectorStore';
import { AppError, BadRequest } from '@backend/utils/errors';
import { logger } from '@backend/utils/logger';
import { recordAudit } from './auditService';

export interface CitationView {
  id: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  section: string;
  excerpt: string;
  similarity: number;
  rank: number;
}

export interface AskResult {
  questionId: string;
  question: string;
  answer: string;
  status: 'GROUNDED' | 'FALLBACK';
  fallbackReason?: string;
  citations: CitationView[];
  explainability: {
    confidence: number;
    confidencePercentage: number;
    confidenceBand: string;
    topSimilarity: number;
    meanSimilarity: number;
    retrievedCount: number;
    acceptedCount: number;
    threshold: number;
    topK: number;
    methodology: string;
    similarityFunction: string;
    whyRelevant: string;
    components: Record<string, number>;
  };
  provider: {
    llm: string;
    llmModel: string;
    embedding: string;
    embeddingModel: string;
    generationMode: 'generative' | 'extractive';
    isNeuralEmbedding: boolean;
    demoMode: boolean;
  };
  latencyMs: number;
}

const MAX_QUESTION_LENGTH = 1000;

export async function ask(params: {
  userId: string;
  question: string;
  ipAddress?: string;
  /**
   * Overrides the configured provider for this question only. Lets the
   * interface answer the same question in either mode so the difference between
   * lexical retrieval with extractive quoting and semantic retrieval with
   * generated prose is directly observable.
   */
  mode?: 'local' | 'gemini' | 'ollama';
}): Promise<AskResult> {
  const started = Date.now();
  const question = params.question.trim();

  if (question.length < 3) throw BadRequest('Please enter a question of at least 3 characters.');
  if (question.length > MAX_QUESTION_LENGTH) {
    throw BadRequest(`Please shorten your question to ${MAX_QUESTION_LENGTH} characters or fewer.`);
  }

  const embeddingProvider = resolveEmbeddingProvider(params.mode);
  const llmProvider = resolveLLMProvider(params.mode);
  const { topK } = env.rag;
  // The threshold belongs to the embedding model, not the application, so it
  // follows whichever provider answered this question.
  const threshold = getActiveThreshold(embeddingProvider);

  await recordAudit({
    userId: params.userId,
    event: 'AI_QUERY',
    metadata: { questionLength: question.length },
    ipAddress: params.ipAddress,
  });

  // 1. Embed the question, 2. retrieve, 3. threshold — all before any LLM call.
  const queryVector = await embeddingProvider.embedOne(question);
  const hits = await vectorStore.search(question, queryVector, topK, embeddingProvider);
  const accepted = hits.filter((h) => h.similarity >= threshold);

  // COST CONTROL + RESPONSIBLE AI: with no qualifying evidence the language
  // model is never invoked. The refusal is produced by the application.
  if (accepted.length === 0) {
    const reason =
      hits.length === 0
        ? 'No policy documents are currently indexed in the knowledge base.'
        : `The closest policy passage scored ${hits[0].similarity.toFixed(2)}, below the ${threshold} relevance threshold.`;

    return finalise({
      embeddingProvider,
      threshold,
      userId: params.userId,
      question,
      answer: FALLBACK_ANSWER,
      status: 'FALLBACK',
      fallbackReason: reason,
      hits,
      accepted: [],
      generationMode: 'extractive',
      llm: { provider: llmProvider.id, model: 'not-invoked' },
      started,
      ipAddress: params.ipAddress,
    });
  }

  // 4. Assemble context, 5. generate a grounded answer.
  const contexts: RetrievedContext[] = accepted
    .slice(0, env.rag.maxContextChunks)
    .map((h) => ({
      documentTitle: h.documentTitle,
      page: h.page,
      section: h.section,
      content: h.content,
      similarity: h.similarity,
    }));

  let answer: string;
  let generationMode: 'generative' | 'extractive';
  let modelRefused = false;
  let llmModel = llmProvider.model;

  try {
    const generated = await llmProvider.generate({
      question,
      contexts,
      systemPrompt: GROUNDING_SYSTEM_PROMPT,
    });
    answer = generated.answer;
    generationMode = generated.mode;
    modelRefused = generated.modelRefused ?? false;
    llmModel = generated.model;
  } catch (e) {
    logger.error('Generation failed', e instanceof Error ? e.message : e);
    // A provider outage must not become a fabricated answer.
    if (e instanceof AppError) throw e;
    throw new AppError(
      'The AI service is temporarily unavailable. Your question was not answered — please try again shortly.',
      503,
      'SERVICE_UNAVAILABLE',
    );
  }

  if (modelRefused) {
    const cleaned = answer.replace(/^INSUFFICIENT_EVIDENCE:\s*/i, '').trim();
    return finalise({
      embeddingProvider,
      threshold,
      userId: params.userId,
      question,
      answer: cleaned || FALLBACK_ANSWER,
      status: 'FALLBACK',
      fallbackReason:
        'Evidence cleared the retrieval threshold, but the model judged it insufficient to answer safely.',
      hits,
      accepted,
      generationMode,
      llm: { provider: llmProvider.id, model: llmModel },
      started,
      ipAddress: params.ipAddress,
    });
  }

  return finalise({
      embeddingProvider,
      threshold,
    userId: params.userId,
    question,
    answer,
    status: 'GROUNDED',
    hits,
    accepted,
    generationMode,
    llm: { provider: llmProvider.id, model: llmModel },
    started,
    ipAddress: params.ipAddress,
  });
}

async function finalise(p: {
  userId: string;
  question: string;
  answer: string;
  status: 'GROUNDED' | 'FALLBACK';
  fallbackReason?: string;
  hits: SearchHit[];
  accepted: SearchHit[];
  generationMode: 'generative' | 'extractive';
  llm: { provider: string; model: string };
  started: number;
  ipAddress?: string;
  // Passed in rather than re-resolved, so the recorded provenance is the mode
  // that actually answered this question.
  embeddingProvider: EmbeddingProvider;
  threshold: number;
}): Promise<AskResult> {
  const { embeddingProvider, threshold } = p;
  const { topK } = env.rag;
  // Confidence is derived from ACCEPTED evidence, so it is correctly zero on a
  // refusal. The reported top similarity, though, describes what retrieval
  // actually found — reporting zero there contradicts the fallback reason,
  // which quotes the best score, and makes the panel look broken.
  const bestSimilarity = p.hits[0]?.similarity ?? 0;
  const conf = calculateConfidence(p.accepted, threshold, topK);
  const latencyMs = Date.now() - p.started;

  // The retrieved snapshot can name a chunk that another process has since
  // removed. Rather than failing the answer, drop the stale foreign key and keep
  // the citation's denormalised title, page and section intact.
  let citableIds = new Set<string>();
  if (p.accepted.length > 0) {
    const live = await prisma.policyChunk.findMany({
      where: { id: { in: p.accepted.map((h) => h.id) } },
      select: { id: true },
    });
    citableIds = new Set(live.map((c) => c.id));
    if (citableIds.size !== p.accepted.length) {
      logger.warn('Vector index was stale; refreshing after citation mismatch.');
      vectorStore.invalidate();
    }
  }

  const record = await prisma.question.create({
    data: {
      userId: p.userId,
      question: p.question,
      answer: p.answer,
      status: p.status,
      topSimilarity: p.accepted.length > 0 ? conf.topSimilarity : bestSimilarity,
      meanSimilarity: conf.meanSimilarity,
      confidence: conf.confidence,
      confidenceBand: conf.band,
      retrievedCount: p.accepted.length,
      threshold,
      topK,
      llmProvider: p.llm.provider,
      llmModel: p.llm.model,
      embeddingProvider: embeddingProvider.id,
      generationMode: p.generationMode,
      latencyMs,
      fallbackReason: p.fallbackReason,
      citations: {
        create: p.accepted.map((hit) => ({
          chunkId: citableIds.has(hit.id) ? hit.id : null,
          documentId: citableIds.has(hit.id) ? hit.documentId : null,
          documentTitle: hit.documentTitle,
          page: hit.page,
          section: hit.section,
          excerpt: hit.content.slice(0, 600),
          similarity: hit.similarity,
          rank: hit.rank,
        })),
      },
    },
    include: { citations: { orderBy: { rank: 'asc' } } },
  });

  await recordAudit({
    userId: p.userId,
    event: p.status === 'GROUNDED' ? 'AI_GROUNDED_RESPONSE' : 'AI_FALLBACK',
    entity: 'Question',
    entityId: record.id,
    metadata: {
      confidence: conf.confidence,
      topSimilarity: bestSimilarity,
      citations: p.accepted.length,
      generationMode: p.generationMode,
      ...(p.fallbackReason ? { fallbackReason: p.fallbackReason } : {}),
    },
    ipAddress: p.ipAddress,
  });

  const top = p.accepted[0];
  return {
    questionId: record.id,
    question: p.question,
    answer: p.answer,
    status: p.status,
    fallbackReason: p.fallbackReason,
    citations: record.citations.map((c) => ({
      id: c.id,
      chunkId: c.chunkId ?? '',
      documentId: c.documentId ?? '',
      documentTitle: c.documentTitle,
      page: c.page,
      section: c.section,
      excerpt: c.excerpt,
      similarity: c.similarity,
      rank: c.rank,
    })),
    explainability: {
      confidence: conf.confidence,
      confidencePercentage: conf.percentage,
      confidenceBand: conf.band,
      topSimilarity: p.accepted.length > 0 ? conf.topSimilarity : bestSimilarity,
      meanSimilarity: conf.meanSimilarity,
      retrievedCount: p.hits.length,
      acceptedCount: p.accepted.length,
      threshold,
      topK,
      methodology: conf.methodology,
      similarityFunction: embeddingProvider.similarityFunction,
      whyRelevant: top
        ? `"${top.documentTitle}" (page ${top.page}, ${top.section}) scored ${top.similarity.toFixed(2)} against the ${threshold} threshold using ${embeddingProvider.similarityFunction} over ${embeddingProvider.model}, making it the strongest supporting evidence.`
        : `No passage reached the ${threshold} threshold, so the assistant refused rather than answering without evidence.`,
      components: conf.components,
    },
    provider: {
      llm: p.llm.provider,
      llmModel: p.llm.model,
      embedding: embeddingProvider.id,
      embeddingModel: embeddingProvider.model,
      generationMode: p.generationMode,
      isNeuralEmbedding: embeddingProvider.isNeural,
      demoMode: env.demoMode,
    },
    latencyMs,
  };
}

export async function getHistory(userId: string, limit = 20) {
  return prisma.question.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { citations: { orderBy: { rank: 'asc' } } },
  });
}
