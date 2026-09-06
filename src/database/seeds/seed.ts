/**
 * Seeds the demonstration environment.
 *
 * Policies are ingested through the production ingestion pipeline
 * (extract → chunk → embed → index), not inserted directly, so the seeded
 * knowledge base is genuinely the product of the system under demonstration.
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '@db/client';
import { env } from '@backend/config/env';
import { hashPassword } from '@backend/services/authService';
import { ingestPolicyPdf } from '@backend/services/documentService';
import { assignRequiredPolicies } from '@backend/services/acknowledgementService';
import { vectorStore } from '@ai/vector-store/vectorStore';
import { POLICIES } from './policy-content';
import { generateAll } from './generate-policy-pdfs';
import { getActiveThreshold } from '@ai/llm-providers/embedding';

const POLICY_DIR = path.resolve(__dirname, 'policies');

/**
 * Demonstration accounts. These are seeded for local academic demonstration only.
 * The password is read from SEED_PASSWORD so it is not committed in documentation.
 */
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'Capstone#2026';

const DEMO_USERS = [
  {
    email: 'employee@company.com',
    name: 'Farhaz Khondoker',
    role: 'EMPLOYEE' as const,
    jobTitle: 'Systems Analyst',
    department: 'Technology Services',
  },
  {
    email: 'hr@company.com',
    name: 'Isuru Koswaththa',
    role: 'HR_OFFICER' as const,
    jobTitle: 'HR Officer',
    department: 'People and Culture',
  },
  {
    email: 'admin@company.com',
    name: 'Dineli Jayandee Gampolage',
    role: 'ADMIN' as const,
    jobTitle: 'System Administrator',
    department: 'Technology Services',
  },
];

async function main() {
  console.log('\n  HR Policy Knowledge Assistant — seeding demonstration environment\n');
  console.log(`  Embedding provider : ${env.embeddingProvider}`);
  console.log(`  AI provider        : ${env.aiProvider}`);
  console.log(`  Retrieval          : TOP_K=${env.rag.topK}, threshold=${getActiveThreshold()}\n`);

  // 1. Reset demonstration data (leaves schema intact).
  console.log('  Clearing existing data...');
  await prisma.citation.deleteMany();
  await prisma.question.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.policyChunk.deleteMany();
  await prisma.policyDocument.deleteMany();
  await prisma.user.deleteMany();
  vectorStore.invalidate();

  // 2. Demonstration users.
  const password = await hashPassword(DEMO_PASSWORD);
  const users = [];
  for (const u of DEMO_USERS) {
    const created = await prisma.user.create({ data: { ...u, password, isDemo: true } });
    users.push(created);
    console.log(`  User created       : ${created.email.padEnd(22)} ${created.role}`);
  }
  const hrOfficer = users.find((u) => u.role === 'HR_OFFICER')!;

  // 3. Ensure the policy PDFs exist, then ingest them through the real pipeline.
  if (!fs.existsSync(POLICY_DIR) || fs.readdirSync(POLICY_DIR).length === 0) {
    console.log('\n  Generating policy PDFs...');
    await generateAll();
  }

  console.log('\n  Ingesting policies through the live pipeline (extract → chunk → embed → index):');
  let totalChunks = 0;
  for (const spec of POLICIES) {
    const filePath = path.join(POLICY_DIR, spec.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ! Missing ${spec.fileName} — skipped`);
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const result = await ingestPolicyPdf({
      buffer,
      originalName: spec.fileName,
      title: spec.title,
      category: spec.category,
      version: spec.version,
      summary: spec.summary,
      requiresAcknowledgement: spec.requiresAcknowledgement,
      uploadedById: hrOfficer.id,
      isDemo: true,
    });
    totalChunks += result.chunkCount;
    console.log(
      `    ✓ ${result.title.padEnd(36)} ${String(result.pageCount).padStart(2)} pages, ${String(result.chunkCount).padStart(3)} chunks`,
    );
  }

  // 4. Assign acknowledgement-required policies to every user.
  console.log('\n  Assigning policy acknowledgements:');
  for (const user of users) {
    const count = await assignRequiredPolicies(user.id);
    console.log(`    • ${user.email.padEnd(22)} ${count} assigned`);
  }

  // 5. One completed acknowledgement so the Completed panel is not empty.
  const employee = users.find((u) => u.role === 'EMPLOYEE')!;
  const conduct = await prisma.policyDocument.findFirst({ where: { title: 'Workplace Conduct Policy' } });
  if (conduct) {
    await prisma.policyAcknowledgement.updateMany({
      where: { userId: employee.id, documentId: conduct.id },
      data: { acknowledgedAt: new Date(Date.now() - 3 * 86_400_000), isDemo: true },
    });
    console.log('    • One acknowledgement pre-completed for the employee account (DEMO DATA)');
  }

  // 6. A sample leave request so the Leave screen has history.
  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      leaveType: 'ANNUAL',
      startDate: new Date('2026-09-14'),
      endDate: new Date('2026-09-18'),
      totalDays: 5,
      reason: 'Family commitments',
      status: 'SUBMITTED',
    },
  });

  const summary = await prisma.policyDocument.count({ where: { status: 'INDEXED' } });
  console.log(`\n  Seed complete: ${summary} policies indexed, ${totalChunks} chunks embedded.\n`);
  console.log('  Demonstration sign-in:');
  for (const u of DEMO_USERS) console.log(`    ${u.role.padEnd(11)} ${u.email}`);
  console.log(`    Password    ${DEMO_PASSWORD}  (override with SEED_PASSWORD)\n`);
}

main()
  .catch((e) => {
    console.error('\n  Seed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
