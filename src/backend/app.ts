import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import { env } from '@backend/config/env';
import { errorHandler, notFoundHandler, asyncHandler } from '@backend/middleware/error';
import { generalLimiter } from '@backend/middleware/rateLimit';
import { getActiveThreshold, getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { getLLMProvider } from '@ai/llm-providers/llm';
import { vectorStore } from '@ai/vector-store/vectorStore';
import acknowledgementRoutes from '@backend/api/acknowledgements';
import adminRoutes from '@backend/api/admin';
import authRoutes from '@backend/api/auth';
import chatRoutes from '@backend/api/chat';
import dashboardRoutes from '@backend/api/dashboard';
import hrRoutes from '@backend/api/hr';
import leaveRoutes from '@backend/api/leave';
import policyRoutes from '@backend/api/policies';

/**
 * Builds the HTTP application.
 *
 * In development the API runs alone and Next.js serves the interface on its own
 * port, proxying /api here. In a hosted deployment one process serves both: the
 * API under /api and the Next.js request handler for everything else, so there
 * is a single URL, a same-origin session cookie, and one service to wake.
 *
 * API-specific middleware is scoped to /api. Applied globally, helmet's default
 * Content-Security-Policy blocks the inline scripts Next.js relies on, the
 * catch-all 404 would swallow every page, and the rate limiter would count each
 * JavaScript chunk a page loads as a request.
 */
export function createApp(options: { frontend?: RequestHandler } = {}) {
  const app = express();

  app.set('trust proxy', 1);

  const api = express.Router();
  api.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  api.use(cors({ origin: env.corsOrigin, credentials: true }));
  api.use(express.json({ limit: '1mb' }));
  api.use(express.urlencoded({ extended: true, limit: '1mb' }));
  api.use(cookieParser());

  // Liveness only: no provider calls, no database round trip. A hosting
  // platform polls this continuously, and /health spends a real embedding call
  // per check.
  api.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  api.use(generalLimiter);

  api.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const embedding = getEmbeddingProvider();
      const llm = getLLMProvider();
      const [embeddingHealth, llmHealth] = await Promise.all([
        embedding.healthCheck(),
        llm.healthCheck(),
      ]);
      return res.json({
        status: 'ok',
        demoMode: env.demoMode,
        indexedChunks: await vectorStore.size(),
        retrieval: { topK: env.rag.topK, threshold: getActiveThreshold() },
        embedding: {
          provider: embedding.id,
          model: embedding.model,
          isNeural: embedding.isNeural,
          similarityFunction: embedding.similarityFunction,
          ...embeddingHealth,
        },
        llm: {
          provider: llm.id,
          model: llm.model,
          isGenerative: llm.isGenerative,
          ...llmHealth,
        },
      });
    }),
  );

  api.use('/auth', authRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use('/chat', chatRoutes);
  api.use('/policies', policyRoutes);
  api.use('/leave', leaveRoutes);
  api.use('/acknowledgements', acknowledgementRoutes);
  api.use('/hr', hrRoutes);
  api.use('/admin', adminRoutes);

  api.use(notFoundHandler);
  api.use(errorHandler);
  app.use('/api', api);

  if (options.frontend) {
    // Security headers for pages, without a CSP that would block Next.js.
    app.use(helmet({ contentSecurityPolicy: false }));
    app.all('*', options.frontend);
  } else {
    app.use(notFoundHandler);
    app.use(errorHandler);
  }
  return app;
}
