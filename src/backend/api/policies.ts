import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { requireAuth, requireHR } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { uploadLimiter } from '@backend/middleware/rateLimit';
import { ingestPolicyPdf, deletePolicy } from '@backend/services/documentService';
import { getPolicy, listPolicies, searchPolicies } from '@backend/services/policyService';
import { recordAudit } from '@backend/services/auditService';
import { BadRequest } from '@backend/utils/errors';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    // Validated again by magic-number check during extraction.
    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(BadRequest('Only PDF policy documents can be uploaded.'));
      return;
    }
    cb(null, true);
  },
});

router.get('/', asyncHandler(async (_req, res) => res.json({ policies: await listPolicies() })));

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchPolicies(q);
    if (q.trim()) {
      await recordAudit({
        userId: req.user!.id,
        event: 'POLICY_SEARCH',
        metadata: { resultCount: results.length },
        ipAddress: req.ip,
      });
    }
    return res.json({ query: q, results });
  }),
);

router.get('/:id', asyncHandler(async (req, res) => res.json({ policy: await getPolicy(req.params.id) })));

router.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const doc = await prisma.policyDocument.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, status: true, statusMessage: true, pageCount: true, chunkCount: true, embeddingModel: true, updatedAt: true },
    });
    if (!doc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That policy could not be found.' } });
    return res.json({ document: doc });
  }),
);

const uploadSchema = z.object({
  title: z.string().trim().min(3, 'Please give the policy a title of at least 3 characters.').max(150),
  category: z.string().trim().max(60).optional(),
  version: z.string().trim().max(20).optional(),
  summary: z.string().trim().max(500).optional(),
  requiresAcknowledgement: z.union([z.boolean(), z.string()]).optional(),
});

router.post(
  '/upload',
  requireHR,
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw BadRequest('Please choose a PDF policy document to upload.');
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid upload details.' },
      });
    }
    const requiresAck =
      parsed.data.requiresAcknowledgement === true || parsed.data.requiresAcknowledgement === 'true';

    const result = await ingestPolicyPdf({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      title: parsed.data.title,
      category: parsed.data.category,
      version: parsed.data.version,
      summary: parsed.data.summary,
      requiresAcknowledgement: requiresAck,
      uploadedById: req.user!.id,
      ipAddress: req.ip,
    });
    return res.status(201).json({ document: result });
  }),
);

router.delete(
  '/:id',
  requireHR,
  asyncHandler(async (req, res) => {
    await deletePolicy(req.params.id);
    return res.json({ success: true });
  }),
);

export default router;
