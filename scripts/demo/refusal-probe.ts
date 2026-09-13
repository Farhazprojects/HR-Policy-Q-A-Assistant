/**
 * Refusal probe. Replays the exact generation step the assistant performs —
 * same retrieval, same threshold, same context assembly, same system prompt —
 * several times per question, and reports how often the model answers versus
 * refuses. Writes nothing to the database.
 *
 *   npx tsx scripts/demo/refusal-probe.ts <mode> <runs> [threshold]
 *
 * An optional threshold lets off-topic questions be forced past retrieval, to
 * test that the model's own refusal still holds when retrieval lets one through.
 */
import { env } from '@backend/config/env';
import { getActiveThreshold, retrievalProviderForMode } from '@ai/llm-providers/embedding';
import { resolveLLMProvider } from '@ai/llm-providers/llm';
import { GROUNDING_SYSTEM_PROMPT } from '@ai/prompt-management/prompt';
import { vectorStore } from '@ai/vector-store/vectorStore';

const mode = (process.argv[2] ?? 'ollama') as 'ollama' | 'gemini';
const runs = Number(process.argv[3] ?? 3);
const forcedThreshold = process.argv[4] ? Number(process.argv[4]) : undefined;
const set = process.argv[5] ?? 'synonyms';

const QUESTIONS: Record<string, string[]> = {
  synonyms: [
    'how much days of sick leave I will get in a year?',
    'how many vacation days do I get',
    'can I work from home?',
  ],
  offtopic: [
    "What is the company's policy on purchasing private aircraft?",
    'Do we get a company yacht and a helicopter?',
    'what is the recipe for sourdough bread',
  ],
};

(async () => {
  const retrieval = retrievalProviderForMode(mode);
  const llm = resolveLLMProvider(mode);
  const threshold = forcedThreshold ?? getActiveThreshold(retrieval);
  console.log(`mode=${mode} llm=${llm.model} retrieval=${retrieval.model} threshold=${threshold} runs=${runs}\n`);

  for (const q of QUESTIONS[set]) {
    const [v] = await retrieval.embed([q]);
    const hits = await vectorStore.search(q, v, env.rag.topK, retrieval);
    const accepted = hits.filter((h) => h.similarity >= threshold);
    if (accepted.length === 0) {
      console.log(`"${q}"\n  refused at retrieval (best ${hits[0]?.similarity.toFixed(3)}) — model not called\n`);
      continue;
    }
    const contexts = accepted.slice(0, env.rag.maxContextChunks).map((h) => ({
      documentTitle: h.documentTitle, page: h.page, section: h.section, content: h.content, similarity: h.similarity,
    }));

    let answered = 0;
    const samples: string[] = [];
    for (let i = 0; i < runs; i += 1) {
      try {
        const r = await llm.generate({ question: q, contexts, systemPrompt: GROUNDING_SYSTEM_PROMPT });
        if (!r.modelRefused) answered += 1;
        samples.push(`${r.modelRefused ? 'REFUSED ' : 'ANSWERED'} ${r.answer.replace(/\s+/g, ' ').slice(0, 110)}`);
      } catch (e) {
        samples.push(`ERROR    ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    console.log(`"${q}"  context: ${contexts.map((c) => c.section).join(' | ')}`);
    console.log(`  answered ${answered}/${runs}`);
    samples.forEach((s) => console.log(`    ${s}`));
    console.log('');
  }
  process.exit(0);
})();
