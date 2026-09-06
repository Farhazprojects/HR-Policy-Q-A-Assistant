import { LOCAL_EMBEDDING_DIMENSIONS } from '@backend/config/env';
import { cosine, features, hashFeature, l2normalise, termFrequencies, tokenize } from '@ai/rag/tokenizer';
import type { EmbeddingProvider, ScoreInput } from './types';

/**
 * Deterministic lexical embedding provider — no external API, no cost, no network.
 *
 * HONEST LABELLING: this is a vector space model (hashed TF-IDF), NOT a learned
 * neural embedding. It matches wording rather than meaning, so a paraphrase using
 * entirely different vocabulary will score lower than it would with Gemini or a
 * local Ollama embedding model. It exists so the full pipeline is demonstrable
 * with no API key, and it is reported as such in the UI and in docs/RAG.md.
 *
 * Similarity function: IDF-weighted query coverage.
 *   score = 0.85 * unigramCoverage + 0.10 * bigramCoverage + 0.05 * cosine
 *   unigramCoverage = (sum of IDF weights of query terms present in the passage)
 *                     / (sum of IDF weights of all query terms)
 * This lives on a genuine 0..1 scale where 0.72 means "72% of the query's
 * informative terms are supported by this passage", so the shipped
 * RETRIEVAL_THRESHOLD carries the same meaning as it does for cosine providers.
 * Cosine over the hashed vectors breaks ties between equally-covered passages.
 */
export class LocalLexicalEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'local' as const;
  readonly model = 'local-lexical-tfidf-v1';
  readonly dimensions = LOCAL_EMBEDDING_DIMENSIONS;
  readonly isNeural = false;
  /** Measured on the seeded corpus: supported 0.918-0.976, unsupported ~0.265. */
  readonly requiresVectorMatch = false;
  readonly defaultThreshold = 0.72;
  readonly similarityFunction = 'idf-weighted-query-coverage';

  private documentFrequency = new Map<string, number>();
  private corpusSize = 0;

  /** Recomputed whenever the vector index is (re)loaded. */
  updateCorpusStats(documents: string[]): void {
    this.documentFrequency = new Map();
    this.corpusSize = documents.length;
    for (const doc of documents) {
      for (const f of new Set(features(doc))) {
        this.documentFrequency.set(f, (this.documentFrequency.get(f) ?? 0) + 1);
      }
    }
  }

  private idf(feature: string): number {
    const df = this.documentFrequency.get(feature) ?? 0;
    // Smoothed IDF; with an empty corpus every term weighs the same.
    return Math.log((this.corpusSize + 1) / (df + 1)) + 1;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedSync(t));
  }

  async embedOne(text: string): Promise<number[]> {
    return this.embedSync(text);
  }

  embedSync(text: string): number[] {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tf = termFrequencies(text);
    for (const [feature, count] of tf) {
      const { index, sign } = hashFeature(feature, this.dimensions);
      // Sublinear term frequency dampens repeated words, weighted by rarity.
      vec[index] += sign * (1 + Math.log(count)) * this.idf(feature);
    }
    return l2normalise(vec);
  }

  similarity(query: ScoreInput, doc: ScoreInput): number {
    const queryUnigrams = new Set(tokenize(query.text));
    if (queryUnigrams.size === 0) return 0;

    const docUnigrams = new Set(tokenize(doc.text));
    const docFeatures = new Set(features(doc.text));

    // Unigram coverage carries the score: it asks how much of the question's
    // informative vocabulary this passage actually supports.
    let matched = 0;
    let total = 0;
    for (const t of queryUnigrams) {
      const w = this.idf(t);
      total += w;
      if (docUnigrams.has(t)) matched += w;
    }
    const unigramCoverage = total === 0 ? 0 : matched / total;

    // Bigrams are a precision bonus, not a penalty. Requiring exact adjacent
    // pairs would punish ordinary rephrasing ("employees are entitled" against
    // "employee entitlement"), so they contribute only a small weight.
    const queryBigrams = [...new Set(features(query.text))].filter((f) => f.includes('_'));
    let bigramCoverage = 0;
    if (queryBigrams.length > 0) {
      const hit = queryBigrams.filter((b) => docFeatures.has(b)).length;
      bigramCoverage = hit / queryBigrams.length;
    }

    const cos = Math.max(0, cosine(query.vector, doc.vector));
    return Math.min(1, unigramCoverage * 0.85 + bigramCoverage * 0.1 + cos * 0.05);
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: 'Local lexical embedding model (deterministic TF-IDF, no external API).',
    };
  }
}
