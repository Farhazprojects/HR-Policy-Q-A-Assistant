import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { retrievalProviderForMode } from '@ai/llm-providers/embedding';
import { resolveLLMProvider } from '@ai/llm-providers/llm';

export type AnsweringMode = 'gemini' | 'ollama' | 'local';

const LABELS: Record<AnsweringMode, string> = { gemini: 'Gemini', ollama: 'Ollama', local: 'Local' };

/**
 * Reports which answering modes can actually serve a question right now, and
 * why not when they cannot — so the interface can disable a mode with an honest
 * reason instead of letting a demonstrator discover it through an error.
 *
 * Deliberately makes no billable call: availability is judged from
 * configuration and the index, plus a local reachability ping for a local
 * Ollama install. Checking Gemini or Ollama Cloud live would spend quota on
 * every page load.
 */
export async function getAnsweringModes() {
  const indexRows = await prisma.policyChunk.groupBy({
    by: ['embeddingModel'],
    where: { document: { status: 'INDEXED' } },
    _count: { _all: true },
  });
  const totalChunks = indexRows.reduce((n, r) => n + r._count._all, 0);
  const vectorsFor = (model: string) =>
    indexRows.find((r) => r.embeddingModel === model)?._count._all ?? 0;

  const modes = await Promise.all(
    (['gemini', 'ollama', 'local'] as AnsweringMode[]).map(async (id) => {
      const retrieval = retrievalProviderForMode(id);
      const generation = resolveLLMProvider(id);

      let reason: string | undefined;

      if (totalChunks === 0) {
        reason = 'No policies are indexed yet.';
      } else if (retrieval.requiresVectorMatch && vectorsFor(retrieval.model) === 0) {
        reason = `The knowledge base is not indexed with ${retrieval.model}. Re-index to enable this mode.`;
      } else if (retrieval.id === 'gemini' && !env.gemini.apiKey) {
        reason = 'Retrieval needs GEMINI_API_KEY in .env.';
      } else if (id === 'gemini' && !env.gemini.apiKey) {
        reason = 'Set GEMINI_API_KEY in .env to enable Gemini.';
      } else if (id === 'ollama') {
        const health = await generation.healthCheck();
        if (!health.ok) {
          reason = env.ollama.apiKey
            ? health.message
            : 'Set OLLAMA_API_KEY in .env to use Ollama Cloud (no local install needed).';
        }
      }

      return {
        id,
        label: LABELS[id],
        available: !reason,
        reason,
        retrieval: { provider: retrieval.id, model: retrieval.model, isNeural: retrieval.isNeural },
        generation: {
          provider: generation.id,
          model: generation.model,
          isGenerative: generation.isGenerative,
          hosted: id === 'gemini' || (id === 'ollama' && Boolean(env.ollama.apiKey)),
        },
      };
    }),
  );

  return { defaultMode: env.aiProvider as AnsweringMode, modes };
}
