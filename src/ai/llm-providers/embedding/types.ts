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

  embed(texts: string[]): Promise<number[][]>;
  embedOne(text: string): Promise<number[]>;
  /** Relevance of a document to a query, on a 0..1 scale. */
  similarity(query: ScoreInput, doc: ScoreInput): number;
  /** Optional corpus statistics hook (used by the lexical provider for IDF). */
  updateCorpusStats?(documents: string[]): void;
  /** Verifies the provider can actually be reached; used by /api/health. */
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}
