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

    const attempt = async (): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.gemini.timeoutMs);
      try {
        return await fetch(
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
            signal: controller.signal,
          },
        );
      } finally {
        clearTimeout(timer);
      }
    };

    // Measured on the free tier: a healthy answer takes 2-5 s, but single calls
    // occasionally stall past 15 s, and bursts of requests hit a per-minute quota
    // (HTTP 429). Without a deadline, a stalled call plus retries reached about a
    // minute on the live deployment.
    //
    // So each attempt has a deadline, and only 503 ("high demand") is retried,
    // once. A 429 quota error does not clear within seconds, so retrying it only
    // delays the failure; the pipeline falls back to another provider instead.
    let res: Response;
    try {
      res = await attempt();
      if (res.status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        res = await attempt();
      }
    } catch (e) {
      const timedOut = e instanceof Error && e.name === 'AbortError';
      throw ServiceUnavailable(
        timedOut
          ? `Gemini did not answer within ${Math.round(env.gemini.timeoutMs / 1000)} seconds.`
          : 'Gemini could not be reached.',
      );
    }

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) {
        throw ServiceUnavailable(
          'The Gemini free-tier quota has been reached. Please try again shortly, or choose Ollama or Local.',
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
