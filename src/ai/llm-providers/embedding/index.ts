import { env } from '@backend/config/env';
import { GeminiEmbeddingProvider } from './gemini';
import { LocalLexicalEmbeddingProvider } from './local';
import { OllamaEmbeddingProvider } from './ollama';
import type { EmbeddingProvider } from './types';

let instance: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (instance) return instance;
  switch (env.embeddingProvider) {
    case 'gemini':
      instance = new GeminiEmbeddingProvider();
      break;
    case 'ollama':
      instance = new OllamaEmbeddingProvider();
      break;
    default:
      instance = new LocalLexicalEmbeddingProvider();
  }
  return instance;
}

/** Test seam — lets a suite pin a provider without mutating environment variables. */
export function setEmbeddingProvider(p: EmbeddingProvider | null): void {
  instance = p;
}

export type { EmbeddingProvider, ScoreInput } from './types';

/**
 * The relevance threshold in force for the active embedding model.
 *
 * Similarity scores are not comparable across models, so the calibrated value
 * lives on the provider. RETRIEVAL_THRESHOLD pins one value across all of them
 * when set explicitly.
 */
export function getActiveThreshold(): number {
  return env.rag.thresholdOverride ?? getEmbeddingProvider().defaultThreshold;
}
