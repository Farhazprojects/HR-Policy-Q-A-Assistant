import rateLimit from 'express-rate-limit';

const json = (message: string) => ({ error: { code: 'TOO_MANY_REQUESTS', message } });
const disabled = process.env.NODE_ENV === 'test';

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: disabled ? 100_000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many requests. Please wait a moment and try again.'),
});

/** Protects the free-tier AI quota as well as the service itself. */
export const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: disabled ? 100_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('You have asked a lot of questions in a short time. Please wait a minute before asking again.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: disabled ? 100_000 : 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: disabled ? 100_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many uploads in a short time. Please wait a moment.'),
});
