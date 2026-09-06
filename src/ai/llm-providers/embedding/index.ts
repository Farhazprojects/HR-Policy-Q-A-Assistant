import { env } from '@backend/config/env';
import { GeminiEmbeddingProvider } from './gemini';
import { LocalLexicalEmbeddingProvider } from './local';
import { OllamaEmbeddingProvider } from './ollama';
import type { EmbeddingProvider } from './types';

let instance: EmbeddingProvider | null = null;
const byName = new Map<string, EmbeddingProvider>();

function build(name: string): EmbeddingProvider {
  switch (name) {
    case 'gemini':
      return new GeminiEmbeddingProvider();
    case 'ollama':
      return new OllamaEmbeddingProvider();
    default:
      return new LocalLexicalEmbeddingProvider();
  }
}

/**
 * Returns the provider for an explicitly requested mode, or the configured
 * default. Instances are cached per name because the lexical provider carries
 * corpus statistics that are expensive to rebuild.
 */
export function resolveEmbeddingProvider(name?: string): EmbeddingProvider {
  if (!name) return getEmbeddingProvider();
  if (name === env.embeddingProvider && instance) return instance;
  let p = byName.get(name);
  if (!p) {
    p = build(name);
    byName.set(name, p);
  }
  return p;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  if (instance) return instance;
  instance = build(env.embeddingProvider);
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
export function getActiveThreshold(provider?: EmbeddingProvider): number {
  return env.rag.thresholdOverride ?? (provider ?? getEmbeddingProvider()).defaultThreshold;
}
