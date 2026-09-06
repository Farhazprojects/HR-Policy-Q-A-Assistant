import { env } from '@backend/config/env';
import { ServiceUnavailable } from '@backend/utils/errors';
import { cosine } from '@ai/rag/tokenizer';
import type { EmbeddingProvider, ScoreInput } from './types';

/** Local Ollama embeddings — fully offline, no API cost. */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'ollama' as const;
  readonly model = env.ollama.embeddingModel;
  readonly dimensions = 768;
  readonly isNeural = true;
  /** Not yet calibrated against a corpus; a conservative cosine starting point. */
  readonly defaultThreshold = 0.60;
  readonly similarityFunction = 'cosine';

  async embedOne(text: string): Promise<number[]> {
    const [v] = await this.embed([text]);
    return v;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const text of texts) {
      let res: Response;
      try {
        res = await fetch(`${env.ollama.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.model, prompt: text }),
        });
      } catch {
        throw ServiceUnavailable(
          `Ollama could not be reached at ${env.ollama.baseUrl}. Start Ollama, or switch EMBEDDING_PROVIDER to "local".`,
        );
      }
      if (!res.ok) {
        throw ServiceUnavailable(
          `Ollama rejected the embedding request. Confirm the model "${this.model}" is pulled (ollama pull ${this.model}).`,
        );
      }
      const json = (await res.json()) as { embedding?: number[] };
      if (!json.embedding?.length) throw ServiceUnavailable('Ollama returned an empty embedding.');
      out.push(json.embedding);
    }
    return out;
  }

  similarity(query: ScoreInput, doc: ScoreInput): number {
    return Math.max(0, cosine(query.vector, doc.vector));
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${env.ollama.baseUrl}/api/tags`);
      if (!res.ok) return { ok: false, message: 'Ollama responded with an error.' };
      return { ok: true, message: `Ollama reachable (${this.model}).` };
    } catch {
      return { ok: false, message: `Ollama is not running at ${env.ollama.baseUrl}.` };
    }
  }
}
