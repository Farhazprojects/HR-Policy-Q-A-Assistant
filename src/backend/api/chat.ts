import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { aiLimiter } from '@backend/middleware/rateLimit';
import { ask, getHistory } from '@backend/services/ragService';

const router = Router();
router.use(requireAuth);

const askSchema = z.object({
  question: z.string().trim().min(3, 'Please enter a question of at least 3 characters.').max(1000),
});

router.post(
  '/',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid question.' },
      });
    }
    const result = await ask({
      userId: req.user!.id,
      question: parsed.data.question,
      ipAddress: req.ip,
    });
    return res.json(result);
  }),
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    return res.json({ history: await getHistory(req.user!.id, limit) });
  }),
);

export default router;
