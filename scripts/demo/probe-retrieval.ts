/** Diagnostic: shows retrieval scores for the demonstration questions. */
import { env } from '@backend/config/env';
import { prisma } from '@db/client';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { vectorStore } from '@ai/vector-store/vectorStore';

const QUESTIONS = [
  'How many days of annual leave are employees entitled to?',
  'What is the process for requesting flexible work?',
  'Do employees need to acknowledge the information security policy?',
  'What are the requirements for remote work?',
  'How do I report a security incident?',
  "What is the company's policy on purchasing private aircraft?",
];

async function main() {
  const p = getEmbeddingProvider();
  console.log(`provider=${p.id} model=${p.model} sim=${p.similarityFunction} threshold=${env.rag.threshold}\n`);
  for (const q of QUESTIONS) {
    const v = await p.embedOne(q);
    const hits = await vectorStore.search(q, v, env.rag.topK);
    const accepted = hits.filter((h) => h.similarity >= env.rag.threshold);
    console.log(`Q: ${q}`);
    console.log(`   accepted=${accepted.length}/${hits.length}`);
    for (const h of hits) {
      console.log(
        `   ${h.similarity >= env.rag.threshold ? '✓' : '·'} ${h.similarity.toFixed(3)}  ${h.documentTitle} p${h.page} — ${h.section}`,
      );
    }
    console.log('');
  }
}
main().finally(() => prisma.$disconnect());
