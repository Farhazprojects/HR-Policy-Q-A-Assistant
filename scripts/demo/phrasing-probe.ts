/**
 * Diagnostic: how sensitive is retrieval to the *wording* of a question?
 * Every question below asks the same thing. Only the vocabulary changes.
 */
import { env } from '@backend/config/env';
import { getActiveThreshold, getEmbeddingProvider } from '@ai/llm-providers/embedding';
import { vectorStore } from '@ai/vector-store/vectorStore';

const QUESTIONS = [
  'How many days of annual leave are employees entitled to?',
  'how many days of annual leave will i get',
  'how much annual leave do I get',
  'what is my holiday allowance',
  'can I take time off',
  'how many vacation days',
  'annual leave',
];

(async () => {
  const provider = getEmbeddingProvider();
  console.log(`provider  : ${provider.name} / ${provider.model}`);
  console.log(`threshold : ${getActiveThreshold()}   topK: ${env.rag.topK}\n`);
  for (const q of QUESTIONS) {
    const [vec] = await provider.embed([q]);
    const hits = await vectorStore.search(q, vec, env.rag.topK);
    const top = hits[0];
    const passes = !!top && top.similarity >= getActiveThreshold();
    console.log(
      `${passes ? 'ANSWERS' : 'REFUSES'}  ${top ? top.similarity.toFixed(3) : '-----'}  "${q}"`,
    );
    if (top) console.log(`                 └─ ${top.documentTitle} p${top.page} · ${top.section}`);
  }
  process.exit(0);
})();
