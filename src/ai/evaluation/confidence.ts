import type { SearchHit } from '@ai/vector-store/vectorStore';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfidenceResult {
  confidence: number; // 0..1
  percentage: number; // 0..100, rounded
  band: ConfidenceBand;
  topSimilarity: number;
  meanSimilarity: number;
  components: {
    topSimilarity: number;
    weightedMean: number;
    thresholdMargin: number;
    evidenceCoverage: number;
  };
  methodology: string;
}

/**
 * Retrieval-derived confidence.
 *
 * The language model is NEVER asked how confident it is. Confidence is computed
 * by the application purely from retrieval evidence, so it means the same thing
 * regardless of which AI provider is configured:
 *
 *   confidence = 0.55 * topSimilarity
 *              + 0.25 * rankWeightedMeanSimilarity
 *              + 0.10 * thresholdMargin
 *              + 0.10 * evidenceCoverage
 *
 *   thresholdMargin   = (topSimilarity - threshold) / (1 - threshold), clamped to 0..1
 *                       — how far the best evidence clears the acceptance bar.
 *   evidenceCoverage  = acceptedChunks / topK, clamped to 0..1
 *                       — whether the answer rests on one passage or several.
 *   rankWeightedMean  = similarities weighted 1/rank, so rank 1 dominates.
 *
 * Bands: HIGH >= 0.80, MEDIUM >= 0.60, otherwise LOW.
 * These weights are prototype configuration values chosen for interpretability;
 * they are not claimed to be empirically optimal. See docs/RAG.md.
 */
export function calculateConfidence(
  accepted: SearchHit[],
  threshold: number,
  topK: number,
): ConfidenceResult {
  if (accepted.length === 0) {
    return {
      confidence: 0,
      percentage: 0,
      band: 'LOW',
      topSimilarity: 0,
      meanSimilarity: 0,
      components: { topSimilarity: 0, weightedMean: 0, thresholdMargin: 0, evidenceCoverage: 0 },
      methodology: 'No retrieved passage met the relevance threshold.',
    };
  }

  const sims = accepted.map((a) => a.similarity);
  const topSimilarity = Math.max(...sims);
  const meanSimilarity = sims.reduce((a, b) => a + b, 0) / sims.length;

  let weightSum = 0;
  let weighted = 0;
  accepted.forEach((hit, i) => {
    const w = 1 / (i + 1);
    weighted += hit.similarity * w;
    weightSum += w;
  });
  const weightedMean = weightSum === 0 ? 0 : weighted / weightSum;

  const denominator = Math.max(1e-6, 1 - threshold);
  const thresholdMargin = clamp01((topSimilarity - threshold) / denominator);
  const evidenceCoverage = clamp01(accepted.length / Math.max(1, topK));

  const confidence = clamp01(
    0.55 * topSimilarity + 0.25 * weightedMean + 0.1 * thresholdMargin + 0.1 * evidenceCoverage,
  );

  return {
    confidence,
    percentage: Math.round(confidence * 100),
    band: confidence >= 0.8 ? 'HIGH' : confidence >= 0.6 ? 'MEDIUM' : 'LOW',
    topSimilarity,
    meanSimilarity,
    components: { topSimilarity, weightedMean, thresholdMargin, evidenceCoverage },
    methodology:
      'Computed by the application from retrieval evidence (0.55·top + 0.25·rank-weighted mean + 0.10·threshold margin + 0.10·evidence coverage). The language model does not supply this figure.',
  };
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
