import { prisma } from '@db/client';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
import type { EmbeddingProvider } from '@ai/llm-providers/embedding';
import { logger } from '@backend/utils/logger';

export interface IndexedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  documentVersion: string;
  documentCategory: string;
  page: number;
  section: string;
  content: string;
  chunkIndex: number;
  vector: number[];
  embeddingModel: string | null;
}

export interface SearchHit extends IndexedChunk {
  similarity: number;
  rank: number;
}

/**
 * Vector store abstraction.
 *
 * Embeddings are held in a float8[] column and similarity is evaluated in the
 * service layer against an in-memory snapshot of the index. Every caller goes
 * through this interface, so replacing it with a pgvector-backed store is a
 * single-class change with no impact on the RAG pipeline.
 * See docs/architecture/rag-pipeline.md.
 */
export interface VectorStore {
  search(
    query: string,
    queryVector: number[],
    topK: number,
    provider?: EmbeddingProvider,
  ): Promise<SearchHit[]>;
  invalidate(): void;
  size(): Promise<number>;
}

/**
 * The snapshot is refreshed on demand, but also expires after a short interval so
 * the index self-heals when the database is changed by another process — most
 * often `npm run seed`, which the demonstration guide tells the operator to run
 * while the server is still running.
 */
const CACHE_TTL_MS = Number(process.env.VECTOR_CACHE_TTL_MS ?? 20_000);

class PostgresArrayVectorStore implements VectorStore {
  private cache: IndexedChunk[] | null = null;
  private loadedAt = 0;

  invalidate(): void {
    this.cache = null;
  }

  private async load(): Promise<IndexedChunk[]> {
    if (this.cache && Date.now() - this.loadedAt < CACHE_TTL_MS) return this.cache;
    this.cache = null;

    const rows = await prisma.policyChunk.findMany({
      where: { document: { status: 'INDEXED' } },
      select: {
        id: true,
        documentId: true,
        page: true,
        section: true,
        content: true,
        chunkIndex: true,
        embedding: true,
        embeddingModel: true,
        document: { select: { title: true, version: true, category: true } },
      },
      orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
    });

    // Every indexed chunk is cached. Which of them a given scorer may use is
    // decided at search time, because the scorer can differ per request.
    this.cache = rows.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      documentTitle: r.document.title,
      documentVersion: r.document.version,
      documentCategory: r.document.category,
      page: r.page,
      section: r.section,
      content: r.content,
      chunkIndex: r.chunkIndex,
      vector: r.embedding,
      embeddingModel: r.embeddingModel,
    }));
    this.loadedAt = Date.now();

    // The lexical provider derives IDF weights from the live corpus.
    getEmbeddingProvider().updateCorpusStats?.(this.cache.map((c) => c.content));

    logger.debug(`Vector index loaded: ${this.cache.length} chunks`);
    return this.cache;
  }

  async search(
    query: string,
    queryVector: number[],
    topK: number,
    provider?: EmbeddingProvider,
  ): Promise<SearchHit[]> {
    const chunks = await this.load();
    if (chunks.length === 0) return [];

    const scorer = provider ?? getEmbeddingProvider();

    // A neural scorer compares vectors directly, so a chunk embedded by another
    // model is not comparable and must be excluded. The lexical scorer reads the
    // passage text, so it can rank any chunk regardless of which model indexed
    // it — that is what lets a question be answered in either mode without
    // re-indexing the corpus.
    const usable = scorer.requiresVectorMatch
      ? chunks.filter((c) => (c.embeddingModel ?? scorer.model) === scorer.model)
      : chunks;

    if (usable.length === 0) {
      logger.warn(
        `No indexed passage is comparable with ${scorer.model}. The corpus was ` +
          `embedded by a different model — re-index with \`npm run seed\`.`,
      );
      return [];
    }

    // The lexical scorer weights terms by corpus statistics, so it needs the
    // corpus it is about to rank.
    scorer.updateCorpusStats?.(usable.map((c) => c.content));

    const queryInput = { text: query, vector: queryVector };
    const scored = usable.map((c) => ({
      ...c,
      similarity: scorer.similarity(queryInput, { text: c.content, vector: c.vector }),
      rank: 0,
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK).map((hit, i) => ({ ...hit, rank: i + 1 }));
  }

  async size(): Promise<number> {
    return (await this.load()).length;
  }

  /** Exposed for diagnostics on the governance dashboard. */
  get lastLoadedAt(): number {
    return this.loadedAt;
  }
}

export const vectorStore: VectorStore = new PostgresArrayVectorStore();
