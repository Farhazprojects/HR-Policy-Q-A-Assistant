import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { createLeaveRequest, getLeaveRequest, listLeaveRequests } from '@backend/services/leaveService';

const router = Router();
router.use(requireAuth);

const leaveSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'PERSONAL', 'CARERS', 'UNPAID', 'LONG_SERVICE']),
  startDate: z.string().min(1, 'Please choose a start date.'),
  endDate: z.string().min(1, 'Please choose an end date.'),
  reason: z.string().trim().min(3, 'Please give a brief reason.').max(500),
});

router.get('/', asyncHandler(async (req, res) => res.json({ requests: await listLeaveRequests(req.user!.id) })));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = leaveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' },
      });
    }
    const request = await createLeaveRequest({ ...parsed.data, userId: req.user!.id, ipAddress: req.ip });
    return res.status(201).json({ request });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => res.json({ request: await getLeaveRequest(req.params.id, req.user!.id) })),
);

export default router;
