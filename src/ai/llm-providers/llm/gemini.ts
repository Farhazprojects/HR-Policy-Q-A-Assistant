import { env } from '@backend/config/env';
import { ServiceUnavailable } from '@backend/utils/errors';
import type { GenerationRequest, GenerationResult, LLMProvider } from './types';

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini' as const;
  readonly model = env.gemini.model;
  readonly isGenerative = true;

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    if (!env.gemini.apiKey) {
      throw ServiceUnavailable(
        'The Gemini service is not configured. Set GEMINI_API_KEY, or switch AI_PROVIDER to "ollama" or "local".',
      );
    }

    const contextBlock = req.contexts
      .map(
        (c, i) =>
          `[SOURCE ${i + 1}] Document: ${c.documentTitle} | Page: ${c.page} | Section: ${c.section}\n${c.content}`,
      )
      .join('\n\n---\n\n');

    const attempt = (): Promise<Response> =>
      fetch(
      `${env.gemini.baseUrl}/models/${this.model}:generateContent?key=${env.gemini.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemPrompt }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `RETRIEVED HR POLICY CONTEXT:\n\n${contextBlock}\n\nEMPLOYEE QUESTION: ${req.question}`,
                },
              ],
            },
          ],
          // Current Gemini flash models reason before answering, and that reasoning is
          // charged against maxOutputTokens. An 800-token cap can be consumed entirely
          // by thinking, returning an empty answer with finishReason MAX_TOKENS.
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048, topP: 0.9 },
        }),
      },
    );

    // The free tier returns 429 (quota) and 503 (high demand) intermittently.
    // Both are transient, so two short retries turn a visible demo failure into
    // a slightly slower answer.
    let res = await attempt();
    for (let i = 0; i < 2 && (res.status === 429 || res.status === 503); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 700 * (i + 1)));
      res = await attempt();
    }

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) {
        throw ServiceUnavailable(
          'The Gemini free-tier quota has been reached. Please try again shortly, or switch AI_PROVIDER to "local" for an offline demonstration.',
        );
      }
      throw ServiceUnavailable('The AI service could not be reached. Please try again.', {
        status: res.status,
        body: body.slice(0, 400),
      });
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!answer) throw ServiceUnavailable('The AI service returned an empty response.');

    return {
      answer,
      provider: this.id,
      model: this.model,
      mode: 'generative',
      modelRefused: /INSUFFICIENT_EVIDENCE/i.test(answer),
    };
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    if (!env.gemini.apiKey) return { ok: false, message: 'GEMINI_API_KEY is not set.' };
    return { ok: true, message: `Gemini configured (${this.model}).` };
  }
}
