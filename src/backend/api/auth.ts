import { Router } from 'express';
import { z } from 'zod';
import { env } from '@backend/config/env';
import { requireAuth } from '@backend/middleware/auth';
import { asyncHandler } from '@backend/middleware/error';
import { authLimiter } from '@backend/middleware/rateLimit';
import { login } from '@backend/services/authService';
import { recordAudit } from '@backend/services/auditService';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Please enter your email address.').email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      });
    }
    const { user, token } = await login(parsed.data.email, parsed.data.password, req.ip);
    res.cookie('token', token, cookieOptions);
    return res.json({ user, token });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.clearCookie('token', { path: '/' });
    return res.json({ success: true });
  }),
);

router.get('/me', requireAuth, asyncHandler(async (req, res) => res.json({ user: req.user })));

export default router;
