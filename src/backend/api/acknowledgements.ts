import { Router } from 'express';
import { requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { acknowledgePolicy, listAcknowledgements } from '@backend/services/acknowledgementService';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => res.json(await listAcknowledgements(req.user!.id))));

router.post(
  '/:policyId',
  asyncHandler(async (req, res) => {
    const acknowledgement = await acknowledgePolicy({
      userId: req.user!.id,
      documentId: req.params.policyId,
      ipAddress: req.ip,
    });
    return res.json({ acknowledgement });
  }),
);

export default router;
