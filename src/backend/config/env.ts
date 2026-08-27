import dotenv from 'dotenv';
import path from 'path';

// Load the repository-root .env so backend and scripts share one configuration.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: string | undefined, fallback = false): boolean =>
  v === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

export type ProviderName = 'gemini' | 'ollama' | 'local';

const provider = (v: string | undefined, fallback: ProviderName): ProviderName => {
  const p = (v ?? '').toLowerCase();
  return p === 'gemini' || p === 'ollama' || p === 'local' ? p : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'insecure-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',

  /** Demo mode never fabricates live AI output — it labels generation honestly. */
  demoMode: bool(process.env.DEMO_MODE, true),

  aiProvider: provider(process.env.AI_PROVIDER, 'local'),
  embeddingProvider: provider(process.env.EMBEDDING_PROVIDER, 'local'),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    baseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL ?? 'llama3.1',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text',
  },

  rag: {
    topK: num(process.env.TOP_K, 4),
    // Prototype configuration value, not an empirically optimised constant.
    threshold: num(process.env.RETRIEVAL_THRESHOLD, 0.72),
    chunkTargetChars: num(process.env.CHUNK_TARGET_CHARS, 900),
    chunkOverlapChars: num(process.env.CHUNK_OVERLAP_CHARS, 150),
    maxContextChunks: num(process.env.MAX_CONTEXT_CHUNKS, 6),
  },

  upload: {
    maxBytes: num(process.env.MAX_UPLOAD_MB, 20) * 1024 * 1024,
    storageDir: process.env.STORAGE_DIR ?? path.resolve(__dirname, '../storage/policies'),
  },
} as const;

export const LOCAL_EMBEDDING_DIMENSIONS = num(process.env.LOCAL_EMBEDDING_DIMENSIONS, 512);
