#!/usr/bin/env node
/**
 * Switches the AI provider mode in .env and reports what changed.
 *
 * Changing the embedding provider invalidates the whole index: vectors from one
 * model cannot be compared with vectors from another, so the corpus MUST be
 * re-embedded afterwards. `npm run mode:*` chains the re-index for that reason —
 * skipping it leaves a knowledge base that silently refuses every question.
 */
import fs from 'node:fs';
import path from 'node:path';

const MODES = {
  local:  { AI_PROVIDER: 'local',  EMBEDDING_PROVIDER: 'local'  },
  gemini: { AI_PROVIDER: 'gemini', EMBEDDING_PROVIDER: 'gemini' },
  ollama: { AI_PROVIDER: 'ollama', EMBEDDING_PROVIDER: 'ollama' },
};

const mode = process.argv[2];
const envPath = path.resolve(process.cwd(), '.env');

if (!MODES[mode]) {
  console.error(`Usage: node scripts/demo/set-mode.mjs <${Object.keys(MODES).join('|')}>`);
  process.exit(1);
}
if (!fs.existsSync(envPath)) {
  console.error('No .env found. Copy .env.example to .env first.');
  process.exit(1);
}

let text = fs.readFileSync(envPath, 'utf8');
for (const [key, value] of Object.entries(MODES[mode])) {
  text = new RegExp(`^${key}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
    : `${text.trimEnd()}\n${key}=${value}\n`;
}
fs.writeFileSync(envPath, text);

if (mode === 'gemini' && !/^GEMINI_API_KEY=.+$/m.test(text)) {
  console.error('\n  GEMINI_API_KEY is empty in .env — Gemini calls will fail.');
  console.error('  Create a key at https://aistudio.google.com/apikey\n');
  process.exit(1);
}

console.log(`\n  Mode set to "${mode}" (${MODES[mode].AI_PROVIDER} generation, ${MODES[mode].EMBEDDING_PROVIDER} embeddings).`);
console.log('  Re-indexing so the corpus matches the new embedding model...\n');
