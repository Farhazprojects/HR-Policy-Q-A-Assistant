import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, createUsers, ingestLeavePolicy, resetDatabase, type TestUsers } from '../support/helpers';

describe('Answering modes', () => {
  let users: TestUsers;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
    await ingestLeavePolicy();
  });

  it('reports all three modes with an honest availability reason', async () => {
    const res = await request(app).get('/api/chat/modes').set(auth(users.employee.token));
    expect(res.status).toBe(200);

    const byId = Object.fromEntries(
      res.body.modes.map((m: { id: string }) => [m.id, m]),
    );
    expect(Object.keys(byId).sort()).toEqual(['gemini', 'local', 'ollama']);

    expect(byId.local.available).toBe(true);
    expect(byId.gemini.available).toBe(false);
    expect(byId.gemini.reason).toMatch(/GEMINI_API_KEY|indexed/);
    expect(byId.ollama.available).toBe(false);
    expect(byId.ollama.reason).toMatch(/OLLAMA_API_KEY/);
  });

  it('retrieves Ollama answers from the configured index, not an Ollama index', async () => {
    const res = await request(app).get('/api/chat/modes').set(auth(users.employee.token));
    const ollama = res.body.modes.find((m: { id: string }) => m.id === 'ollama');
    // Ollama Cloud has no embeddings API, so retrieval must use the corpus's own index.
    expect(ollama.retrieval.provider).toBe('local');
    expect(ollama.generation.provider).toBe('ollama');
  });

  it('still refuses before any model call in Ollama mode', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set(auth(users.employee.token))
      .send({ question: 'what is the recipe for sourdough bread', mode: 'ollama' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('FALLBACK');
    // Refusal happens in the application, so an unconfigured provider is never reached.
    expect(res.body.provider.llmModel).toBe('not-invoked');
  });

  it('fails cleanly, with a service error, when Ollama is unreachable', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set(auth(users.employee.token))
      .send({ question: 'How many days of annual leave are employees entitled to?', mode: 'ollama' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toMatch(/Ollama/);
  });

  it('requires authentication to list modes', async () => {
    const res = await request(app).get('/api/chat/modes');
    expect(res.status).toBe(401);
  });
});
