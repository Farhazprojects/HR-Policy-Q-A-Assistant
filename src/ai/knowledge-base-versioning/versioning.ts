/**
 * Knowledge-base versioning.
 *
 * A policy document is identified in the knowledge base by (title, version).
 * Re-uploading the same bytes must never regenerate embeddings — that is the
 * project's primary cost control — and superseding a policy must be a
 * deliberate act of publishing a new version number rather than a silent
 * overwrite, so that acknowledgements and citations stay attributable to the
 * exact revision an employee actually saw.
 */
import crypto from 'crypto';
import { prisma } from '@db/client';
import { BadRequest } from '@backend/utils/errors';

export const DEFAULT_VERSION = '1.0';

/** Stable content fingerprint used to detect an unchanged re-upload. */
export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function resolveVersion(requested?: string): string {
  return requested?.trim() || DEFAULT_VERSION;
}

/**
 * Rejects an upload that would duplicate an existing revision, either by
 * (title, version) or by identical file content under any title.
 */
export async function assertRevisionIsNew(params: {
  title: string;
  version: string;
  checksum: string;
}): Promise<void> {
  const existing = await prisma.policyDocument.findUnique({
    where: { title_version: { title: params.title, version: params.version } },
  });
  if (existing) {
    throw BadRequest(
      `"${params.title}" version ${params.version} already exists in the knowledge base. ` +
        `Upload it under a new version number to supersede it.`,
    );
  }

  // COST CONTROL: identical file bytes are never re-embedded.
  const duplicate = await prisma.policyDocument.findFirst({
    where: { checksum: params.checksum },
  });
  if (duplicate) {
    throw BadRequest(
      `That exact file is already indexed as "${duplicate.title}" (version ${duplicate.version}).`,
    );
  }
}
