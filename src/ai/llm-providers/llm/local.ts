import type { GenerationRequest, GenerationResult, LLMProvider } from './types';

/**
 * Extractive, non-generative answer composer for DEMO_MODE / offline demonstration.
 *
 * ACADEMIC HONESTY: this provider does not run a language model. It quotes the
 * highest-scoring retrieved policy passages and attributes them. Every response
 * it produces is labelled mode: "extractive" and the interface displays
 * "Extractive (no language model)" so that it can never be mistaken for live AI
 * generation. Set AI_PROVIDER=gemini or AI_PROVIDER=ollama for real generation.
 */
export class LocalExtractiveProvider implements LLMProvider {
  readonly id = 'local' as const;
  readonly model = 'extractive-composer-v1';
  readonly isGenerative = false;

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const top = req.contexts[0];
    if (!top) {
      return {
        answer:
          'I could not find sufficient information in the approved HR policy documents to answer this question. Please contact HR for clarification.',
        provider: this.id,
        model: this.model,
        mode: 'extractive',
        modelRefused: true,
      };
    }

    const sentences = this.selectSentences(top.content, req.question, 3);
    const supporting = req.contexts
      .slice(1, 3)
      .map((c) => `• ${c.documentTitle} — page ${c.page}, ${c.section}`)
      .join('\n');

    const answer = [
      `According to the ${top.documentTitle} (page ${top.page}, ${top.section}):`,
      '',
      sentences,
      '',
      supporting ? `Related policy sections:\n${supporting}` : '',
      'This response quotes the approved policy text directly. For advice on how the policy applies to your circumstances, contact HR.',
    ]
      .filter(Boolean)
      .join('\n');

    return { answer, provider: this.id, model: this.model, mode: 'extractive' };
  }

  /** Picks the sentences of the passage that best overlap the question. */
  private selectSentences(content: string, question: string, limit: number): string {
    const qTerms = new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 3),
    );
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
    if (sentences.length === 0) return content.slice(0, 500);

    const scored = sentences.map((s, i) => {
      const lower = s.toLowerCase();
      let score = 0;
      for (const t of qTerms) if (lower.includes(t)) score += 1;
      return { s, i, score };
    });
    const chosen = scored.every((x) => x.score === 0)
      ? scored.slice(0, limit)
      : [...scored].sort((a, b) => b.score - a.score).slice(0, limit).sort((a, b) => a.i - b.i);
    return chosen.map((c) => c.s).join(' ');
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: 'Extractive composer active — quotes policy text, does not generate.',
    };
  }
}
