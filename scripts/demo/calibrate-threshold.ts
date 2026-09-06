/**
 * Threshold calibration. Similarity scales differ per embedding model, so the
 * relevance threshold must be measured per provider, not carried across.
 * Prints the separation between questions the corpus supports and questions it
 * genuinely does not.
 */
import { env } from '@backend/config/env';
import { getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { vectorStore } from '@ai/vector-store/vectorStore';

const SUPPORTED = [
  'How many days of annual leave are employees entitled to?',
  'how many days of annual leave will i get',
  'how much annual leave do I get',
  'what is my holiday allowance',
  'how many vacation days',
  'can I take time off',
  'What is the process for requesting flexible work?',
  'What are the requirements for remote work?',
  'How do I report a security incident?',
  'Do employees need to acknowledge the information security policy?',
  'what happens if I bully a colleague',
  'who approves my leave request',
];

const UNSUPPORTED = [
  "What is the company's policy on purchasing private aircraft?",
  'Do we get a company yacht and a helicopter?',
  'what is the maintenance schedule for submarine periscopes',
  'how do I file my personal tax return in Denmark',
  'what is the recipe for sourdough bread',
  'which football team does the CEO support',
];

(async () => {
  const provider = getEmbeddingProvider();
  const score = async (q: string) => {
    const [v] = await provider.embed([q]);
    const hits = await vectorStore.search(q, v, env.rag.topK);
    return hits[0]?.similarity ?? 0;
  };

  const sup: number[] = [];
  const uns: number[] = [];
  console.log(`\nmodel: ${provider.model}\n`);
  console.log('SUPPORTED (should be answerable)');
  for (const q of SUPPORTED) {
    const s = await score(q);
    sup.push(s);
    console.log(`  ${s.toFixed(3)}  ${q.slice(0, 62)}`);
  }
  console.log('\nUNSUPPORTED (must refuse)');
  for (const q of UNSUPPORTED) {
    const s = await score(q);
    uns.push(s);
    console.log(`  ${s.toFixed(3)}  ${q.slice(0, 62)}`);
  }

  const minSup = Math.min(...sup);
  const maxUns = Math.max(...uns);
  console.log(`\nlowest supported : ${minSup.toFixed(3)}`);
  console.log(`highest unsupported: ${maxUns.toFixed(3)}`);
  console.log(`gap                : ${(minSup - maxUns).toFixed(3)}`);
  if (minSup > maxUns) {
    console.log(`\n  → a threshold anywhere in (${maxUns.toFixed(3)}, ${minSup.toFixed(3)}) separates them`);
    console.log(`  → midpoint suggestion: ${((minSup + maxUns) / 2).toFixed(2)}`);
  } else {
    console.log('\n  → NO clean separation: the classes overlap. Threshold alone cannot split them.');
  }
  process.exit(0);
})();
