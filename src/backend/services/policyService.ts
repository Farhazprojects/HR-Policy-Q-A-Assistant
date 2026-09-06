import { prisma } from '@db/client';
import { env } from '@backend/config/env';
import { getActiveThreshold, getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { vectorStore } from '@ai/vector-store/vectorStore';
import { NotFound } from '@backend/utils/errors';

export interface PolicySearchResult {
  id: string;
  title: string;
  category: string;
  version: string;
  summary: string | null;
  updatedAt: Date;
  pageCount: number;
  chunkCount: number;
  isDemo: boolean;
  relevantSections: string[];
  bestMatch: { page: number; section: string; excerpt: string; similarity: number } | null;
  score: number;
}

export async function listPolicies(options?: { includeAll?: boolean }) {
  return prisma.policyDocument.findMany({
    where: options?.includeAll ? {} : { status: 'INDEXED' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, title: true, category: true, version: true, summary: true,
      pageCount: true, chunkCount: true, status: true, statusMessage: true,
      isDemo: true, requiresAcknowledgement: true, createdAt: true, updatedAt: true,
      embeddingModel: true, effectiveDate: true,
      uploadedBy: { select: { name: true, role: true } },
    },
  });
}

export async function getPolicy(id: string) {
  const doc = await prisma.policyDocument.findUnique({
    where: { id },
    include: {
      chunks: {
        orderBy: [{ page: 'asc' }, { chunkIndex: 'asc' }],
        select: { id: true, page: true, section: true, content: true, chunkIndex: true },
      },
      uploadedBy: { select: { name: true, role: true } },
    },
  });
  if (!doc) throw NotFound('That policy could not be found.');
  const { filePath, ...safe } = doc; // never expose the server path
  return safe;
}

/**
 * Semantic + lexical policy search. Runs over the same indexed knowledge base
 * the RAG pipeline uses, so search results and AI citations stay consistent.
 */
export async function searchPolicies(query: string): Promise<PolicySearchResult[]> {
  const trimmed = query.trim();
  const documents = await listPolicies();

  if (!trimmed) {
    return documents.map((d) => ({
      id: d.id, title: d.title, category: d.category, version: d.version,
      summary: d.summary, updatedAt: d.updatedAt, pageCount: d.pageCount,
      chunkCount: d.chunkCount, isDemo: d.isDemo,
      relevantSections: [], bestMatch: null, score: 0,
    }));
  }

  const provider = getEmbeddingProvider();
  const vector = await provider.embedOne(trimmed);
  // Search wider than the RAG top-K so several documents can surface.
  const hits = await vectorStore.search(trimmed, vector, 40);

  const byDocument = new Map<string, typeof hits>();
  for (const hit of hits) {
    const list = byDocument.get(hit.documentId) ?? [];
    list.push(hit);
    byDocument.set(hit.documentId, list);
  }

  const results: PolicySearchResult[] = [];
  for (const doc of documents) {
    const docHits = byDocument.get(doc.id) ?? [];
    const titleMatch = doc.title.toLowerCase().includes(trimmed.toLowerCase()) ? 0.35 : 0;
    const best = docHits[0];
    const score = Math.max(best?.similarity ?? 0, titleMatch);
    if (score <= 0.05) continue;

    results.push({
      id: doc.id, title: doc.title, category: doc.category, version: doc.version,
      summary: doc.summary, updatedAt: doc.updatedAt, pageCount: doc.pageCount,
      chunkCount: doc.chunkCount, isDemo: doc.isDemo,
      relevantSections: [...new Set(docHits.slice(0, 4).map((h) => h.section))],
      bestMatch: best
        ? { page: best.page, section: best.section, excerpt: best.content.slice(0, 320), similarity: best.similarity }
        : null,
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export const retrievalConfig = { topK: env.rag.topK, threshold: getActiveThreshold() };
