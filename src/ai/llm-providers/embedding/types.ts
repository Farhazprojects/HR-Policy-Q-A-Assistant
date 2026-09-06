/** Text plus its vector. Lexical scorers need the text; neural scorers use only the vector. */
export interface ScoreInput {
  text: string;
  vector: number[];
}

export interface EmbeddingProvider {
  readonly id: 'gemini' | 'ollama' | 'local';
  readonly model: string;
  readonly dimensions: number;
  /** True for learned semantic embeddings, false for the deterministic lexical model. */
  readonly isNeural: boolean;
  /** Name of the similarity function this provider declares, shown in the UI and docs. */
  readonly similarityFunction: string;
  /**
   * Relevance threshold calibrated for THIS model's similarity scale.
   *
   * Scores are not comparable across models: the lexical scorer separates
   * supported from unsupported questions by roughly 0.65, while Gemini cosine
   * separates them by roughly 0.015 on the same corpus. Carrying one number
   * across providers silently breaks either recall or refusal, so each provider
   * owns its own. RETRIEVAL_THRESHOLD overrides it when set.
   */
  readonly defaultThreshold: number;

  embed(texts: string[]): Promise<number[][]>;
  embedOne(text: string): Promise<number[]>;
  /** Relevance of a document to a query, on a 0..1 scale. */
  similarity(query: ScoreInput, doc: ScoreInput): number;
  /** Optional corpus statistics hook (used by the lexical provider for IDF). */
  updateCorpusStats?(documents: string[]): void;
  /** Verifies the provider can actually be reached; used by /api/health. */
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}
