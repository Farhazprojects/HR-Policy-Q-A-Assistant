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

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`HR Policy Knowledge Assistant API listening on http://localhost:${env.port}`);
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
