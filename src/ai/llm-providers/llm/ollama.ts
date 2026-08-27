import { env } from '@backend/config/env';
import { ServiceUnavailable } from '@backend/utils/errors';
import type { GenerationRequest, GenerationResult, LLMProvider } from './types';

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama' as const;
  readonly model = env.ollama.model;
  readonly isGenerative = true;

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const contextBlock = req.contexts
      .map(
        (c, i) =>
          `[SOURCE ${i + 1}] Document: ${c.documentTitle} | Page: ${c.page} | Section: ${c.section}\n${c.content}`,
      )
      .join('\n\n---\n\n');

    let res: Response;
    try {
      res = await fetch(`${env.ollama.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          options: { temperature: 0.2 },
          messages: [
            { role: 'system', content: req.systemPrompt },
            {
              role: 'user',
              content: `RETRIEVED HR POLICY CONTEXT:\n\n${contextBlock}\n\nEMPLOYEE QUESTION: ${req.question}`,
            },
          ],
        }),
      });
    } catch {
      throw ServiceUnavailable(
        `Ollama could not be reached at ${env.ollama.baseUrl}. Start Ollama, or switch AI_PROVIDER to "local".`,
      );
    }

    if (!res.ok) {
      throw ServiceUnavailable(
        `Ollama rejected the request. Confirm the model "${this.model}" is pulled (ollama pull ${this.model}).`,
      );
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
    try {
      const res = await fetch(`${env.ollama.baseUrl}/api/tags`);
      return res.ok
        ? { ok: true, message: `Ollama reachable (${this.model}).` }
        : { ok: false, message: 'Ollama responded with an error.' };
    } catch {
      return { ok: false, message: `Ollama is not running at ${env.ollama.baseUrl}.` };
    }
  }
}
