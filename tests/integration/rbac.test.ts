import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, createUsers, policyBuffer, resetDatabase, type TestUsers } from '../support/helpers';
import { prisma } from '@db/client';

/** TEST 5 (mandated): an employee attempting an HR-only operation is denied. */
describe('Role-based access control', () => {
  let users: TestUsers;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
  });

  it('denies an employee the HR policy upload endpoint', async () => {
    const res = await request(app)
      .post('/api/policies/upload')
      .set(auth(users.employee.token))
      .field('title', 'Unauthorised Upload')
      .attach('file', policyBuffer('remote-work-policy.pdf'), 'remote-work-policy.pdf');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('denies an employee the HR dashboard', async () => {
    const res = await request(app).get('/api/hr/dashboard').set(auth(users.employee.token));
    expect(res.status).toBe(403);
  });

  it('denies an employee the admin governance dashboard', async () => {
    const res = await request(app).get('/api/admin/governance').set(auth(users.employee.token));
    expect(res.status).toBe(403);
  });

  it('denies an HR officer the admin governance dashboard', async () => {
    const res = await request(app).get('/api/admin/governance').set(auth(users.hr.token));
    expect(res.status).toBe(403);
  });

  it('records denied attempts as ACCESS_DENIED audit events', async () => {
    await request(app).get('/api/admin/governance').set(auth(users.employee.token));
    const log = await prisma.auditLog.findFirst({
      where: { event: 'ACCESS_DENIED', userId: users.employee.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(log).not.toBeNull();
  });

  it('allows an HR officer the HR dashboard', async () => {
    const res = await request(app).get('/api/hr/dashboard').set(auth(users.hr.token));
    expect(res.status).toBe(200);
  });

  it('allows an admin both the HR dashboard and governance', async () => {
    const hr = await request(app).get('/api/hr/dashboard').set(auth(users.admin.token));
    const gov = await request(app).get('/api/admin/governance').set(auth(users.admin.token));
    expect(hr.status).toBe(200);
    expect(gov.status).toBe(200);
  });

  it('allows every role the shared employee endpoints', async () => {
    for (const token of [users.employee.token, users.hr.token, users.admin.token]) {
      const res = await request(app).get('/api/policies').set(auth(token));
      expect(res.status).toBe(200);
    }
  });
});
