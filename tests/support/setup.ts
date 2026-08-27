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
