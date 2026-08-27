import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app, assignAcknowledgements, auth, createUsers, ingestLeavePolicy, policyBuffer,
  resetDatabase, type TestUsers,
} from '../support/helpers';
import { prisma } from '@db/client';
import { calculateDays } from '@backend/services/leaveService';

describe('Employee features, HR upload and governance', () => {
  let users: TestUsers;
  let policyId: string;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
    const ingested = await ingestLeavePolicy(users.hr.id);
    policyId = ingested.documentId;
    await assignAcknowledgements(users.employee.id);
  });

  describe('Policy search', () => {
    it('finds a policy by its content', async () => {
      const res = await request(app)
        .get('/api/policies/search?q=annual%20leave')
        .set(auth(users.employee.token));

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.results[0].title).toBe('Employee Leave Policy');
      expect(res.body.results[0].bestMatch.page).toBeGreaterThan(0);
      expect(res.body.results[0].relevantSections.length).toBeGreaterThan(0);
    });

    it('returns every indexed policy for an empty query', async () => {
      const res = await request(app).get('/api/policies/search?q=').set(auth(users.employee.token));
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('returns nothing for an unrelated query', async () => {
      const res = await request(app)
        .get('/api/policies/search?q=submarine%20periscope%20maintenance')
        .set(auth(users.employee.token));
      expect(res.body.results).toHaveLength(0);
    });

    it('never exposes the server-side file path', async () => {
      const res = await request(app).get(`/api/policies/${policyId}`).set(auth(users.employee.token));
      expect(res.status).toBe(200);
      expect(res.body.policy).not.toHaveProperty('filePath');
      expect(res.body.policy.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Leave requests', () => {
    it('counts inclusive calendar days', () => {
      expect(calculateDays(new Date('2026-09-14'), new Date('2026-09-18'))).toBe(5);
      expect(calculateDays(new Date('2026-09-14'), new Date('2026-09-14'))).toBe(1);
    });

    it('stores a submitted leave request', async () => {
      const res = await request(app)
        .post('/api/leave')
        .set(auth(users.employee.token))
        .send({
          leaveType: 'ANNUAL', startDate: '2026-09-14',
          endDate: '2026-09-18', reason: 'Family commitments',
        });

      expect(res.status).toBe(201);
      expect(res.body.request.status).toBe('SUBMITTED');
      expect(res.body.request.totalDays).toBe(5);

      const stored = await prisma.leaveRequest.findUnique({ where: { id: res.body.request.id } });
      expect(stored?.userId).toBe(users.employee.id);
      expect(stored?.isPrototypeWorkflow).toBe(true);
    });

    it('rejects an end date before the start date', async () => {
      const res = await request(app)
        .post('/api/leave')
        .set(auth(users.employee.token))
        .send({ leaveType: 'ANNUAL', startDate: '2026-09-18', endDate: '2026-09-14', reason: 'Invalid' });
      expect(res.status).toBe(400);
    });

    it('rejects an unknown leave type', async () => {
      const res = await request(app)
        .post('/api/leave')
        .set(auth(users.employee.token))
        .send({ leaveType: 'SABBATICAL', startDate: '2026-09-14', endDate: '2026-09-18', reason: 'x' });
      expect(res.status).toBe(400);
    });

    it('lists only the signed-in user\'s requests', async () => {
      const mine = await request(app).get('/api/leave').set(auth(users.employee.token));
      const theirs = await request(app).get('/api/leave').set(auth(users.hr.token));
      expect(mine.body.requests.length).toBeGreaterThan(0);
      expect(theirs.body.requests).toHaveLength(0);
    });

    it('writes a LEAVE_REQUEST audit event', async () => {
      expect(await prisma.auditLog.count({ where: { event: 'LEAVE_REQUEST' } })).toBeGreaterThan(0);
    });
  });

  describe('Policy acknowledgements', () => {
    it('lists policies assigned for acknowledgement', async () => {
      const res = await request(app).get('/api/acknowledgements').set(auth(users.employee.token));
      expect(res.status).toBe(200);
      expect(res.body.pendingCount).toBeGreaterThan(0);
    });

    it('records an acknowledgement with a timestamp against the employee', async () => {
      const res = await request(app)
        .post(`/api/acknowledgements/${policyId}`)
        .set(auth(users.employee.token));

      expect(res.status).toBe(200);
      expect(res.body.acknowledgement.acknowledgedAt).toBeTruthy();

      const stored = await prisma.policyAcknowledgement.findFirst({
        where: { userId: users.employee.id, documentId: policyId },
      });
      expect(stored?.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('refuses a duplicate acknowledgement', async () => {
      const res = await request(app)
        .post(`/api/acknowledgements/${policyId}`)
        .set(auth(users.employee.token));
      expect(res.status).toBe(400);
    });

    it('refuses to acknowledge a policy that was never assigned', async () => {
      const res = await request(app)
        .post(`/api/acknowledgements/${policyId}`)
        .set(auth(users.hr.token));
      expect(res.status).toBe(404);
    });

    it('writes a POLICY_ACKNOWLEDGED audit event', async () => {
      expect(await prisma.auditLog.count({ where: { event: 'POLICY_ACKNOWLEDGED' } })).toBeGreaterThan(0);
    });
  });

  describe('Upload makes a policy retrievable', () => {
    /** TEST 3 + TEST 4 (mandated): upload a new policy, then retrieve it via Ask AI. */
    it('indexes an uploaded policy and immediately answers questions from it', async () => {
      const before = await request(app)
        .post('/api/chat')
        .set(auth(users.employee.token))
        .send({ question: 'How many counselling sessions does the employee assistance programme provide?' });

      // Nothing about wellbeing is indexed yet, so the assistant must refuse.
      expect(before.body.status).toBe('FALLBACK');

      const upload = await request(app)
        .post('/api/policies/upload')
        .set(auth(users.hr.token))
        .field('title', 'Employee Wellbeing and Support Policy')
        .field('category', 'Wellbeing')
        .field('version', '1.0')
        .attach('file', policyBuffer('employee-wellbeing-support-policy.pdf'), 'employee-wellbeing-support-policy.pdf');

      expect(upload.status).toBe(201);
      expect(upload.body.document.status).toBe('INDEXED');
      expect(upload.body.document.chunkCount).toBeGreaterThan(0);

      // TEST 3 — the new policy is searchable.
      const search = await request(app)
        .get('/api/policies/search?q=employee%20assistance%20programme')
        .set(auth(users.employee.token));
      expect(search.body.results.some((r: { title: string }) =>
        r.title === 'Employee Wellbeing and Support Policy')).toBe(true);

      // TEST 4 — the new policy is retrieved by the RAG pipeline.
      const after = await request(app)
        .post('/api/chat')
        .set(auth(users.employee.token))
        .send({ question: 'How many counselling sessions does the employee assistance programme provide?' });

      expect(after.body.status).toBe('GROUNDED');
      expect(after.body.citations[0].documentTitle).toBe('Employee Wellbeing and Support Policy');
      expect(after.body.answer).toMatch(/6 counselling sessions/i);
    });
  });

  describe('Governance metrics', () => {
    it('computes metrics from the database rather than hard-coded values', async () => {
      const res = await request(app).get('/api/admin/governance').set(auth(users.admin.token));
      expect(res.status).toBe(200);

      const policies = await prisma.policyDocument.count({ where: { status: 'INDEXED' } });
      const questions = await prisma.question.count();
      const grounded = await prisma.question.count({ where: { status: 'GROUNDED' } });
      const fallbacks = await prisma.question.count({ where: { status: 'FALLBACK' } });

      expect(res.body.knowledgeBase.policiesIndexed).toBe(policies);
      expect(res.body.ai.totalQuestions).toBe(questions);
      expect(res.body.ai.groundedAnswers).toBe(grounded);
      expect(res.body.ai.fallbacks).toBe(fallbacks);
      expect(res.body.ai.groundingRate).toBeCloseTo(grounded / questions, 5);
      expect(res.body.retrieval.threshold).toBe(0.72);
      expect(res.body.retrieval.topK).toBe(4);
    });

    it('reports the active provider configuration honestly', async () => {
      const res = await request(app).get('/api/admin/governance').set(auth(users.admin.token));
      expect(res.body.generation.provider).toBe('local');
      expect(res.body.generation.isGenerative).toBe(false);
      expect(res.body.retrieval.isNeuralEmbedding).toBe(false);
    });

    it('returns audit activity for administrators', async () => {
      const res = await request(app).get('/api/admin/activity').set(auth(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body.activity.length).toBeGreaterThan(0);
      expect(res.body.activity[0]).toHaveProperty('event');
    });

    it('reports HR dashboard metrics consistent with the database', async () => {
      const res = await request(app).get('/api/hr/dashboard').set(auth(users.hr.token));
      const policies = await prisma.policyDocument.count({ where: { status: 'INDEXED' } });
      expect(res.body.metrics.policiesIndexed).toBe(policies);
      expect(res.body.recentUploads.length).toBeGreaterThan(0);
    });
  });
});
