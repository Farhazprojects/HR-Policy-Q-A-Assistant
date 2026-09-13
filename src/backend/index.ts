import path from 'path';
import type { RequestHandler } from 'express';
import { createApp } from './app';
import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { logger } from '@backend/utils/logger';
import { getActiveThreshold } from '@ai/llm-providers/embedding';

async function main() {
  if (!env.databaseUrl) {
    logger.error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
    process.exit(1);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    logger.error(
      'Could not connect to PostgreSQL. Confirm the server is running and DATABASE_URL is correct.',
    );
    process.exit(1);
  }

  // SERVE_FRONTEND=true runs the built Next.js interface in this same process,
  // which is how the hosted deployment serves one URL. Development leaves it
  // unset and runs `next dev` separately.
  let frontend: RequestHandler | undefined;
  if (process.env.SERVE_FRONTEND === 'true') {
    // Loaded only when needed, so the API alone never pays Next's start-up cost.
    const next = (await import('next')).default;
    const dir = process.env.FRONTEND_DIR ?? path.resolve(process.cwd(), 'src/frontend');
    const nextApp = next({ dev: false, dir });
    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();
    frontend = (req, res) => void handle(req, res);
    logger.info(`Serving the web interface from ${dir}`);
  }

  const app = createApp({ frontend });
  const server = app.listen(env.port, () => {
    logger.info(
      `HR Policy Knowledge Assistant ${frontend ? 'app' : 'API'} listening on http://localhost:${env.port}`,
    );
    logger.info(
      `AI provider: ${env.aiProvider} | Embeddings: ${env.embeddingProvider} | Demo mode: ${env.demoMode}`,
    );
    logger.info(`Retrieval: TOP_K=${env.rag.topK}, threshold=${getActiveThreshold()}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down.`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
