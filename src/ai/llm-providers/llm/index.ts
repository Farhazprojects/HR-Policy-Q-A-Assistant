import { env } from '@backend/config/env';
import { GeminiProvider } from './gemini';
import { LocalExtractiveProvider } from './local';
import { OllamaProvider } from './ollama';
import type { LLMProvider } from './types';

let instance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (instance) return instance;
  switch (env.aiProvider) {
    case 'gemini':
      instance = new GeminiProvider();
      break;
    case 'ollama':
      instance = new OllamaProvider();
      break;
    default:
      instance = new LocalExtractiveProvider();
  }
  return instance;
}

export function setLLMProvider(p: LLMProvider | null): void {
  instance = p;
}

export type { LLMProvider, GenerationRequest, GenerationResult, RetrievedContext } from './types';
