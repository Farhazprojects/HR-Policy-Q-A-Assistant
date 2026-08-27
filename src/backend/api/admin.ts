import { Router } from 'express';
import { requireAdmin, requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { getGovernanceMetrics, getRecentActivity } from '@backend/services/governanceService';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/governance', asyncHandler(async (_req, res) => res.json(await getGovernanceMetrics())));

router.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    return res.json({ activity: await getRecentActivity(limit) });
  }),
);

export default router;
