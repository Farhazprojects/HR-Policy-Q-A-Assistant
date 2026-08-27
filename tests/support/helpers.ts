import './setup';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '@backend/app';
import { prisma } from '@db/client';
import { hashPassword } from '@backend/services/authService';
import { ingestPolicyPdf } from '@backend/services/documentService';
import { assignRequiredPolicies } from '@backend/services/acknowledgementService';
import { vectorStore } from '@ai/vector-store/vectorStore';

export const TEST_PASSWORD = 'TestPassw0rd!';
export const POLICY_DIR = path.resolve(__dirname, '../../src/database/seeds/policies');

export const app: Express = createApp();

export interface TestUsers {
  employee: { id: string; token: string };
  hr: { id: string; token: string };
  admin: { id: string; token: string };
}

export async function resetDatabase(): Promise<void> {
  await prisma.citation.deleteMany();
  await prisma.question.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.policyChunk.deleteMany();
  await prisma.policyDocument.deleteMany();
  await prisma.user.deleteMany();
  vectorStore.invalidate();
}

export async function login(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORD });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.body.token as string;
}

export async function createUsers(): Promise<TestUsers> {
  const password = await hashPassword(TEST_PASSWORD);
  const [employee, hr, admin] = await Promise.all([
    prisma.user.create({ data: { email: 'emp@test.local', name: 'Test Employee', role: 'EMPLOYEE', password } }),
    prisma.user.create({ data: { email: 'hr@test.local', name: 'Test HR', role: 'HR_OFFICER', password } }),
    prisma.user.create({ data: { email: 'admin@test.local', name: 'Test Admin', role: 'ADMIN', password } }),
  ]);
  return {
    employee: { id: employee.id, token: await login(employee.email) },
    hr: { id: hr.id, token: await login(hr.email) },
    admin: { id: admin.id, token: await login(admin.email) },
  };
}

export function policyBuffer(fileName: string): Buffer {
  return fs.readFileSync(path.join(POLICY_DIR, fileName));
}

/** Ingests the leave policy through the real pipeline so retrieval tests have evidence. */
export async function ingestLeavePolicy(uploadedById?: string) {
  return ingestPolicyPdf({
    buffer: policyBuffer('employee-leave-policy.pdf'),
    originalName: 'employee-leave-policy.pdf',
    title: 'Employee Leave Policy',
    category: 'Leave & Entitlements',
    version: '4.2',
    summary: 'Annual leave, personal leave and the process for requesting leave.',
    requiresAcknowledgement: true,
    uploadedById,
    isDemo: true,
  });
}

export async function assignAcknowledgements(userId: string) {
  return assignRequiredPolicies(userId);
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
