import { env } from '@backend/config/env';
import { GeminiProvider } from './gemini';
import { LocalExtractiveProvider } from './local';
import { OllamaProvider } from './ollama';
import type { LLMProvider } from './types';

let instance: LLMProvider | null = null;
const byName = new Map<string, LLMProvider>();

function build(name: string): LLMProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      return new LocalExtractiveProvider();
  }
}

/** Provider for an explicitly requested mode, or the configured default. */
export function resolveLLMProvider(name?: string): LLMProvider {
  if (!name) return getLLMProvider();
  if (name === env.aiProvider && instance) return instance;
  let p = byName.get(name);
  if (!p) {
    p = build(name);
    byName.set(name, p);
  }
  return p;
}

export function getLLMProvider(): LLMProvider {
  if (instance) return instance;
  instance = build(env.aiProvider);
  return instance;
}

export function setLLMProvider(p: LLMProvider | null): void {
  instance = p;
}

export type { LLMProvider, GenerationRequest, GenerationResult, RetrievedContext } from './types';
