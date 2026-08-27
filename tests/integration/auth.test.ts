import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, createUsers, resetDatabase, TEST_PASSWORD, type TestUsers } from '../support/helpers';
import { prisma } from '@db/client';

describe('Authentication', () => {
  let users: TestUsers;

  beforeAll(async () => {
    await resetDatabase();
    users = await createUsers();
  });

  it('signs in a valid user and returns a token without the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@test.local', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('emp@test.local');
    expect(res.body.user.role).toBe('EMPLOYEE');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('sets an httpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@test.local', password: TEST_PASSWORD });

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects a wrong password without revealing whether the account exists', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@test.local', password: 'not-the-password' });
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'not-the-password' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
  });

  it('records failed sign-in attempts in the audit log', async () => {
    await request(app).post('/api/auth/login').send({ email: 'emp@test.local', password: 'bad' });
    const count = await prisma.auditLog.count({ where: { event: 'LOGIN_FAILED' } });
    expect(count).toBeGreaterThan(0);
  });

  it('rejects a malformed email with a validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for protected endpoints', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(users.employee.token));
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('EMPLOYEE');
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(`${users.employee.token}x`));
    expect(res.status).toBe(401);
  });
});
