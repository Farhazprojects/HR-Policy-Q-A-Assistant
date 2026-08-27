import { Router } from 'express';
import { requireAuth, requireHR } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { getHrDashboard } from '@backend/services/governanceService';

const router = Router();
router.use(requireAuth, requireHR);

router.get('/dashboard', asyncHandler(async (_req, res) => res.json(await getHrDashboard())));

export default router;
