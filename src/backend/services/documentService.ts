import fs from 'fs/promises';
import path from 'path';
import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { chunkPages } from '@ai/rag/chunker';
import { extractPdf } from '@ai/rag/pdf';
import { vectorStore } from '@ai/vector-store/vectorStore';
import {
  assertRevisionIsNew,
  computeChecksum,
  resolveVersion,
} from '@ai/knowledge-base-versioning/versioning';
import { AppError, BadRequest } from '@backend/utils/errors';
import { logger } from '@backend/utils/logger';
import { recordAudit } from './auditService';

export interface IngestParams {
  buffer: Buffer;
  originalName: string;
  title: string;
  category?: string;
  version?: string;
  summary?: string;
  requiresAcknowledgement?: boolean;
  uploadedById?: string;
  isDemo?: boolean;
  ipAddress?: string;
}

export interface IngestResult {
  documentId: string;
  title: string;
  pageCount: number;
  chunkCount: number;
  status: string;
  embeddingModel: string;
  skippedEmbedding: boolean;
}

/**
 * Full ingestion pipeline:
 * validate → persist file → extract text (page-aware) → chunk → embed → store → index.
 * Document status is advanced at each stage so the UI can report real progress.
 */
export async function ingestPolicyPdf(params: IngestParams): Promise<IngestResult> {
  const title = params.title.trim();
  if (!title) throw BadRequest('A policy title is required.');
  if (params.buffer.length === 0) throw BadRequest('The uploaded file is empty.');
  if (params.buffer.length > env.upload.maxBytes) {
    throw BadRequest(
      `That file is larger than the ${Math.round(env.upload.maxBytes / 1024 / 1024)} MB limit.`,
    );
  }

  const version = resolveVersion(params.version);
  const checksum = computeChecksum(params.buffer);
  await assertRevisionIsNew({ title, version, checksum });

  await fs.mkdir(env.upload.storageDir, { recursive: true });
  const safeName = `${Date.now()}-${params.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(env.upload.storageDir, safeName);
  await fs.writeFile(filePath, params.buffer);

  const doc = await prisma.policyDocument.create({
    data: {
      title,
      category: params.category?.trim() || 'General',
      version,
      summary: params.summary?.trim() || null,
      filePath,
      originalName: params.originalName,
      fileSize: params.buffer.length,
      checksum,
      status: 'EXTRACTING',
      requiresAcknowledgement: params.requiresAcknowledgement ?? false,
      isDemo: params.isDemo ?? false,
      uploadedById: params.uploadedById ?? null,
      effectiveDate: new Date(),
    },
  });

  await recordAudit({
    userId: params.uploadedById,
    event: 'POLICY_UPLOAD',
    entity: 'PolicyDocument',
    entityId: doc.id,
    metadata: { title, version, fileSize: params.buffer.length },
    ipAddress: params.ipAddress,
  });

  try {
    const extraction = await extractPdf(params.buffer);
    await prisma.policyDocument.update({
      where: { id: doc.id },
      data: { status: 'CHUNKING', pageCount: extraction.pageCount },
    });

    const chunks = chunkPages(extraction.pages);
    if (chunks.length === 0) {
      throw BadRequest('No usable text could be chunked from that PDF.');
    }

    await prisma.policyDocument.update({
      where: { id: doc.id },
      data: { status: 'EMBEDDING', chunkCount: chunks.length },
    });

    const provider = getEmbeddingProvider();
    const vectors = await provider.embed(chunks.map((c) => c.content));

    await prisma.policyChunk.createMany({
      data: chunks.map((c, i) => ({
        documentId: doc.id,
        chunkIndex: c.chunkIndex,
        page: c.page,
        section: c.section,
        content: c.content,
        tokenCount: c.tokenCount,
        embedding: vectors[i],
        embeddingModel: provider.model,
      })),
    });

    const updated = await prisma.policyDocument.update({
      where: { id: doc.id },
      data: {
        status: 'INDEXED',
        statusMessage: null,
        embeddingModel: provider.model,
        pageCount: extraction.pageCount,
        chunkCount: chunks.length,
      },
    });

    // The new document must be retrievable immediately.
    vectorStore.invalidate();

    await recordAudit({
      userId: params.uploadedById,
      event: 'POLICY_INDEXED',
      entity: 'PolicyDocument',
      entityId: doc.id,
      metadata: {
        pages: extraction.pageCount,
        chunks: chunks.length,
        embeddingModel: provider.model,
      },
      ipAddress: params.ipAddress,
    });

    logger.info(`Indexed "${title}" — ${extraction.pageCount} pages, ${chunks.length} chunks`);

    return {
      documentId: updated.id,
      title: updated.title,
      pageCount: updated.pageCount,
      chunkCount: updated.chunkCount,
      status: updated.status,
      embeddingModel: provider.model,
      skippedEmbedding: false,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown processing error.';
    await prisma.policyDocument.update({
      where: { id: doc.id },
      data: { status: 'FAILED', statusMessage: message.slice(0, 500) },
    });
    await recordAudit({
      userId: params.uploadedById,
      event: 'POLICY_INDEX_FAILED',
      entity: 'PolicyDocument',
      entityId: doc.id,
      metadata: { reason: message.slice(0, 200) },
      ipAddress: params.ipAddress,
    });
    // Do not leave an unreadable file on disk.
    await fs.unlink(filePath).catch(() => undefined);
    if (e instanceof AppError) throw e;
    throw new AppError(`The policy could not be processed: ${message}`, 422, 'INGESTION_FAILED');
  }
}

export async function deletePolicy(documentId: string): Promise<void> {
  const doc = await prisma.policyDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw BadRequest('That policy could not be found.');
  await fs.unlink(doc.filePath).catch(() => undefined);
  await prisma.policyDocument.delete({ where: { id: documentId } });
  vectorStore.invalidate();
}
