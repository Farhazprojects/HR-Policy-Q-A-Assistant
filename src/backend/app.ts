import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from '@backend/config/env';
import { errorHandler, notFoundHandler, asyncHandler } from '@backend/middleware/error';
import { generalLimiter } from '@backend/middleware/rateLimit';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
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

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get(
    '/api/health',
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
        retrieval: { topK: env.rag.topK, threshold: env.rag.threshold },
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

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/policies', policyRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/acknowledgements', acknowledgementRoutes);
  app.use('/api/hr', hrRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
