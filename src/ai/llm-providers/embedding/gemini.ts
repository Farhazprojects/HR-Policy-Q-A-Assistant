import { env } from '@backend/config/env';
import { ServiceUnavailable } from '@backend/utils/errors';
import { cosine, l2normalise } from '@ai/rag/tokenizer';
import type { EmbeddingProvider, ScoreInput } from './types';

/** Google Gemini embeddings. Free tier eligible; model id is configurable. */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'gemini' as const;
  readonly model = env.gemini.embeddingModel;
  /**
   * gemini-embedding-001 returns 3072 dimensions by default. A smaller width is
   * requested explicitly so the declared size matches what is actually stored —
   * a mismatch would silently corrupt similarity once vectors are persisted.
   */
  readonly dimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768);
  readonly isNeural = true;
  /** Measured on the seeded corpus: supported 0.618-0.889, unsupported 0.448-0.603. */
  readonly defaultThreshold = 0.61;
  readonly similarityFunction = 'cosine';

  private assertKey(): void {
    if (!env.gemini.apiKey) {
      throw ServiceUnavailable(
        'The Gemini embedding service is not configured. Set GEMINI_API_KEY, or switch EMBEDDING_PROVIDER to "local" or "ollama".',
      );
    }
  }

  async embedOne(text: string): Promise<number[]> {
    const [v] = await this.embed([text]);
    return v;
  }

  async embed(texts: string[]): Promise<number[][]> {
    this.assertKey();
    const out: number[][] = [];
    // Sequential requests keep the free-tier rate limit comfortable.
    for (const text of texts) {
      const res = await fetch(
        `${env.gemini.baseUrl}/models/${this.model}:embedContent?key=${env.gemini.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${this.model}`,
            content: { parts: [{ text }] },
            outputDimensionality: this.dimensions,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        throw ServiceUnavailable(
          res.status === 429
            ? 'The Gemini embedding quota has been reached. Try again shortly, or switch EMBEDDING_PROVIDER to "local".'
            : 'The Gemini embedding service could not be reached.',
          { status: res.status, body: body.slice(0, 400) },
        );
      }
      const json = (await res.json()) as { embedding?: { values?: number[] } };
      const values = json.embedding?.values;
      if (!values?.length) throw ServiceUnavailable('Gemini returned an empty embedding.');
      if (values.length !== this.dimensions) {
        throw ServiceUnavailable(
          `Gemini returned a ${values.length}-dimension embedding but this provider is ` +
            `configured for ${this.dimensions}. Set GEMINI_EMBEDDING_DIMENSIONS to match.`,
        );
      }
      // Truncated output dimensions are not unit-length, so normalise before
      // storing: cosine similarity assumes normalised vectors here.
      out.push(l2normalise(values));
    }
    return out;
  }

  similarity(query: ScoreInput, doc: ScoreInput): number {
    return Math.max(0, cosine(query.vector, doc.vector));
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    if (!env.gemini.apiKey) return { ok: false, message: 'GEMINI_API_KEY is not set.' };
    try {
      await this.embed(['health check']);
      return { ok: true, message: `Gemini embeddings reachable (${this.model}).` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Unknown error.' };
    }
  }
}
