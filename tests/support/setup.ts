/**
 * Test bootstrap. Runs against a dedicated database so the demonstration data in
 * hr_policy_assistant is never touched by a test run.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://admin@localhost:5432/hr_policy_assistant_test?schema=public';
process.env.JWT_SECRET = 'test-secret';
process.env.AI_PROVIDER = 'local';
process.env.EMBEDDING_PROVIDER = 'local';
process.env.DEMO_MODE = 'true';
process.env.TOP_K = '4';
process.env.RETRIEVAL_THRESHOLD = '0.72';
// Pin every hosted provider to "unconfigured". Without this, tests inherit
// whatever keys are in the developer's .env — results would then depend on who
// runs them, and a stray call could spend real quota. The Ollama URL points at a
// closed local port so reachability checks fail instantly and deterministically.
process.env.GEMINI_API_KEY = '';
process.env.OLLAMA_API_KEY = '';
process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:9';
