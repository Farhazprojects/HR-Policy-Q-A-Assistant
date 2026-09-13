import { env } from '@backend/config/env';
import { ServiceUnavailable } from '@backend/utils/errors';
import type { GenerationRequest, GenerationResult, LLMProvider } from './types';

/** True when requests go to Ollama Cloud rather than a local install. */
export const isOllamaCloud = (): boolean => Boolean(env.ollama.apiKey);

export function ollamaHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(env.ollama.apiKey ? { Authorization: `Bearer ${env.ollama.apiKey}` } : {}),
  };
}

/**
 * Ollama generation — either Ollama Cloud (hosted, API key, nothing stored
 * locally) or a local Ollama install. Both expose the same /api/chat contract,
 * so one provider serves both; only the base URL and auth header differ.
 */
export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama' as const;
  readonly model = env.ollama.model;
  readonly isGenerative = true;

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    if (!isOllamaCloud() && !env.ollama.baseUrl.includes('localhost') && !env.ollama.baseUrl.includes('127.0.0.1')) {
      // A remote base URL without a key will only ever return 401.
      throw ServiceUnavailable('Ollama Cloud is not configured. Set OLLAMA_API_KEY in .env.');
    }

    const contextBlock = req.contexts
      .map(
        (c, i) =>
          `[SOURCE ${i + 1}] Document: ${c.documentTitle} | Page: ${c.page} | Section: ${c.section}\n${c.content}`,
      )
      .join('\n\n---\n\n');

    const body = JSON.stringify({
      model: this.model,
      stream: false,
      // gpt-oss models reason before answering; low effort keeps a grounded,
      // context-bound answer fast without changing what it is allowed to say.
      ...(this.model.startsWith('gpt-oss') ? { think: 'low' } : {}),
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: req.systemPrompt },
        {
          role: 'user',
          content: `RETRIEVED HR POLICY CONTEXT:\n\n${contextBlock}\n\nEMPLOYEE QUESTION: ${req.question}`,
        },
      ],
    });

    const attempt = async (): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.ollama.timeoutMs);
      try {
        return await fetch(`${env.ollama.baseUrl}/api/chat`, {
          method: 'POST',
          headers: ollamaHeaders(),
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    let res: Response;
    try {
      res = await attempt();
      // Hosted capacity is shared; 429 and 503 are usually momentary.
      for (let i = 0; i < 2 && (res.status === 429 || res.status === 503); i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
        res = await attempt();
      }
    } catch (e) {
      const timedOut = e instanceof Error && e.name === 'AbortError';
      throw ServiceUnavailable(
        timedOut
          ? `Ollama did not answer within ${Math.round(env.ollama.timeoutMs / 1000)} seconds. Try again, or switch to another mode.`
          : isOllamaCloud()
            ? 'Ollama Cloud could not be reached. Check your connection, or switch to another mode.'
            : `Ollama could not be reached at ${env.ollama.baseUrl}. Start Ollama, or switch to another mode.`,
      );
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      const message =
        res.status === 401 || res.status === 403
          ? 'Ollama Cloud rejected the API key. Check OLLAMA_API_KEY in .env.'
          : res.status === 402 || res.status === 429
            ? 'The Ollama Cloud usage allowance has been reached. Switch to another mode, or try again later.'
            : res.status === 404
              ? `The Ollama model "${this.model}" is not available to this account. Set OLLAMA_MODEL to a model your plan includes.`
              : 'Ollama could not complete the request. Try again, or switch to another mode.';
      throw ServiceUnavailable(message, { status: res.status, body: detail });
    }

    const json = (await res.json()) as { message?: { content?: string } };
    const answer = json.message?.content?.trim();
    if (!answer) throw ServiceUnavailable('Ollama returned an empty response.');

    return {
      answer,
      provider: this.id,
      model: this.model,
      mode: 'generative',
      modelRefused: /INSUFFICIENT_EVIDENCE/i.test(answer),
    };
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    if (isOllamaCloud()) {
      // Configuration check only: a live call would spend usage credits on
      // every health probe.
      return { ok: true, message: `Ollama Cloud configured (${this.model}).` };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${env.ollama.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok
        ? { ok: true, message: `Ollama reachable (${this.model}).` }
        : { ok: false, message: 'Ollama responded with an error.' };
    } catch {
      return { ok: false, message: `Ollama is not running at ${env.ollama.baseUrl}.` };
    }
  }
}
