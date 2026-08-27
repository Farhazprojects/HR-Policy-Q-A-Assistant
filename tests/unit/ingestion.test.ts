import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app, auth, createUsers, ingestLeavePolicy, policyBuffer, resetDatabase, type TestUsers,
} from '../support/helpers';
import { prisma } from '@db/client';
import { extractPdf } from '@ai/rag/pdf';
import { chunkPages } from '@ai/rag/chunker';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';

describe('Document processing pipeline', () => {
  let users: TestUsers;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
  });

  it('extracts text page by page from a PDF', async () => {
    const result = await extractPdf(policyBuffer('employee-leave-policy.pdf'));
    expect(result.pageCount).toBeGreaterThan(1);
    expect(result.pages.length).toBeGreaterThan(1);
    expect(result.pages[0].page).toBe(1);
    expect(result.totalCharacters).toBeGreaterThan(1000);
  });

  it('rejects a file that is not a PDF', async () => {
    await expect(extractPdf(Buffer.from('this is plain text, not a pdf'))).rejects.toThrow(
      /not a valid PDF/i,
    );
  });

  it('rejects an empty file', async () => {
    await expect(extractPdf(Buffer.alloc(0))).rejects.toThrow(/empty/i);
  });

  it('chunks pages while preserving page numbers and detecting sections', async () => {
    const extraction = await extractPdf(policyBuffer('employee-leave-policy.pdf'));
    const chunks = chunkPages(extraction.pages);

    expect(chunks.length).toBeGreaterThan(3);
    // Every chunk must carry a real page number for citation.
    for (const c of chunks) {
      expect(c.page).toBeGreaterThan(0);
      expect(c.page).toBeLessThanOrEqual(extraction.pageCount);
      expect(c.content.length).toBeGreaterThanOrEqual(60);
    }
    const sections = new Set(chunks.map((c) => c.section));
    expect(sections.size).toBeGreaterThan(2);
    expect([...sections].some((s) => /annual leave/i.test(s))).toBe(true);
  });

  it('produces normalised embeddings of the configured dimension', async () => {
    const provider = getEmbeddingProvider();
    const [vector] = await provider.embed(['annual leave entitlements for permanent employees']);
    expect(vector).toHaveLength(provider.dimensions);
    const norm = Math.sqrt(vector.reduce((n, v) => n + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it('produces identical embeddings for identical text (deterministic)', async () => {
    const provider = getEmbeddingProvider();
    const [a, b] = await provider.embed(['annual leave', 'annual leave']);
    expect(a).toEqual(b);
  });

  it('ingests a policy end to end and marks it INDEXED', async () => {
    const result = await ingestLeavePolicy(users.hr.id);
    expect(result.status).toBe('INDEXED');
    expect(result.pageCount).toBeGreaterThan(1);
    expect(result.chunkCount).toBeGreaterThan(3);

    const chunks = await prisma.policyChunk.findMany({ where: { documentId: result.documentId } });
    expect(chunks.length).toBe(result.chunkCount);
    expect(chunks.every((c) => c.embedding.length > 0)).toBe(true);
  });

  it('writes POLICY_UPLOAD and POLICY_INDEXED audit events', async () => {
    const uploads = await prisma.auditLog.count({ where: { event: 'POLICY_UPLOAD' } });
    const indexed = await prisma.auditLog.count({ where: { event: 'POLICY_INDEXED' } });
    expect(uploads).toBeGreaterThan(0);
    expect(indexed).toBeGreaterThan(0);
  });

  it('refuses to re-embed an identical file (cost control)', async () => {
    await expect(ingestLeavePolicy(users.hr.id)).rejects.toThrow(/already/i);
  });

  it('rejects a non-PDF upload through the API', async () => {
    const res = await request(app)
      .post('/api/policies/upload')
      .set(auth(users.hr.token))
      .field('title', 'Not A Policy')
      .attach('file', Buffer.from('plain text'), 'notes.txt');
    expect(res.status).toBe(400);
  });

  it('rejects an upload with no title', async () => {
    const res = await request(app)
      .post('/api/policies/upload')
      .set(auth(users.hr.token))
      .field('title', '')
      .attach('file', policyBuffer('remote-work-policy.pdf'), 'remote-work-policy.pdf');
    expect(res.status).toBe(400);
  });
});
