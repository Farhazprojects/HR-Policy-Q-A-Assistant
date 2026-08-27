import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, createUsers, ingestLeavePolicy, resetDatabase, type TestUsers } from '../support/helpers';
import { prisma } from '@db/client';
import { calculateConfidence } from '@ai/evaluation/confidence';
import type { SearchHit } from '@ai/vector-store/vectorStore';

const ask = (token: string, question: string) =>
  request(app).post('/api/chat').set(auth(token)).send({ question });

describe('RAG pipeline', () => {
  let users: TestUsers;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
    await ingestLeavePolicy();
  });

  /** TEST 1 (mandated): a supported HR question returns a grounded answer. */
  it('answers a supported question with a grounded, cited response', async () => {
    const res = await ask(users.employee.token, 'How many days of annual leave are employees entitled to?');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('GROUNDED');
    expect(res.body.citations.length).toBeGreaterThan(0);

    const citation = res.body.citations[0];
    expect(citation.documentTitle).toBe('Employee Leave Policy');
    expect(citation.page).toBeGreaterThan(0);
    expect(citation.section).toBeTruthy();
    expect(citation.excerpt.length).toBeGreaterThan(0);
    expect(citation.similarity).toBeGreaterThanOrEqual(res.body.explainability.threshold);

    // The answer must actually reflect the policy content.
    expect(res.body.answer).toMatch(/20 days/);
  });

  /** TEST 2 (mandated): an unsupported question triggers refusal, not invention. */
  it('refuses an unsupported question instead of inventing an answer', async () => {
    const res = await ask(users.employee.token, "What is the company's policy on purchasing private aircraft?");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('FALLBACK');
    expect(res.body.citations).toHaveLength(0);
    expect(res.body.answer).toMatch(/could not find sufficient information/i);
    expect(res.body.answer).toMatch(/contact HR/i);
    expect(res.body.fallbackReason).toBeTruthy();
  });

  it('does not invoke the language model when no evidence passes the threshold', async () => {
    const res = await ask(users.employee.token, 'Do we get a company yacht and a helicopter?');
    expect(res.body.status).toBe('FALLBACK');
    // Proves the cost-control and responsible-AI requirement.
    expect(res.body.provider.llmModel).toBe('not-invoked');
  });

  it('records every question with its retrieval evidence', async () => {
    const before = await prisma.question.count();
    await ask(users.employee.token, 'What is the process for requesting annual leave?');
    const after = await prisma.question.count();
    expect(after).toBe(before + 1);

    const q = await prisma.question.findFirst({ orderBy: { createdAt: 'desc' } });
    expect(q?.threshold).toBe(0.72);
    expect(q?.topK).toBe(4);
    expect(q?.embeddingProvider).toBe('local');
  });

  it('writes AI_QUERY plus a grounded or fallback audit event', async () => {
    const queries = await prisma.auditLog.count({ where: { event: 'AI_QUERY' } });
    const grounded = await prisma.auditLog.count({ where: { event: 'AI_GROUNDED_RESPONSE' } });
    const fallback = await prisma.auditLog.count({ where: { event: 'AI_FALLBACK' } });
    expect(queries).toBeGreaterThan(0);
    expect(grounded).toBeGreaterThan(0);
    expect(fallback).toBeGreaterThan(0);
  });

  it('rejects an empty or overlong question', async () => {
    expect((await ask(users.employee.token, 'a')).status).toBe(400);
    expect((await ask(users.employee.token, 'x'.repeat(1001))).status).toBe(400);
  });

  it('requires authentication to ask a question', async () => {
    const res = await request(app).post('/api/chat').send({ question: 'How much annual leave?' });
    expect(res.status).toBe(401);
  });

  it('returns question history for the signed-in user only', async () => {
    const res = await request(app).get('/api/chat/history').set(auth(users.employee.token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.history)).toBe(true);

    const other = await request(app).get('/api/chat/history').set(auth(users.hr.token));
    expect(other.body.history).toHaveLength(0);
  });
});

describe('Confidence calculation', () => {
  const hit = (similarity: number): SearchHit =>
    ({
      id: 'c', documentId: 'd', documentTitle: 'T', documentVersion: '1', documentCategory: 'C',
      page: 1, section: 'S', content: 'text', chunkIndex: 0, vector: [], similarity, rank: 1,
    }) as SearchHit;

  it('returns zero confidence and a LOW band when nothing was accepted', () => {
    const r = calculateConfidence([], 0.72, 4);
    expect(r.confidence).toBe(0);
    expect(r.band).toBe('LOW');
  });

  it('rises with stronger retrieval evidence', () => {
    const weak = calculateConfidence([hit(0.73)], 0.72, 4);
    const strong = calculateConfidence([hit(0.98), hit(0.95), hit(0.9), hit(0.85)], 0.72, 4);
    expect(strong.confidence).toBeGreaterThan(weak.confidence);
    expect(strong.band).toBe('HIGH');
  });

  it('stays within 0..1 and reports its own methodology', () => {
    const r = calculateConfidence([hit(1), hit(1), hit(1), hit(1)], 0.72, 4);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.methodology).toMatch(/retrieval evidence/i);
    expect(r.methodology).toMatch(/does not supply/i);
  });

  it('derives the percentage from the confidence, not from the model', () => {
    const r = calculateConfidence([hit(0.9), hit(0.8)], 0.72, 4);
    expect(r.percentage).toBe(Math.round(r.confidence * 100));
  });
});
