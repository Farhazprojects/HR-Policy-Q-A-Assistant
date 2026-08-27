/**
 * Shared lexical tokenisation used by the local embedding provider and by the
 * lexical relevance scorer. Deterministic and dependency-free.
 */

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','of','to','in','on','at','for','with','as','by','from',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had','it',
  'its','this','that','these','those','i','you','he','she','we','they','me','my','our','your',
  'their','them','us','him','her','what','which','who','whom','when','where','why','how','can',
  'could','should','would','may','might','must','will','shall','not','no','nor','so','than',
  'too','very','just','also','there','here','about','into','over','under','then','up','down',
  'out','off','any','all','each','more','most','other','some','such','own','same','s','t',
  // Interrogative and quantifier words. They shape the question but appear in no
  // policy text, so leaving them in would penalise otherwise perfect matches.
  'many','much','need','needs','needed','please','tell','know','want','wants','wanted',
  'anyone','someone','something','anything','let','get','gets','got',
]);

/** Light suffix stripping — enough to match "entitlements"/"entitlement", not a full stemmer. */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith('sses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)
    .filter((t) => t.length > 1);
}

/** Unigrams plus adjacent bigrams, so short phrases such as "annual leave" carry weight. */
export function features(text: string): string[] {
  const tokens = tokenize(text);
  const out = [...tokens];
  for (let i = 0; i < tokens.length - 1; i += 1) out.push(`${tokens[i]}_${tokens[i + 1]}`);
  return out;
}

export function termFrequencies(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of features(text)) map.set(f, (map.get(f) ?? 0) + 1);
  return map;
}

/** FNV-1a — stable across processes, unlike JS object iteration order. */
export function hashFeature(feature: string, dimensions: number): { index: number; sign: number } {
  let h = 0x811c9dc5;
  for (let i = 0; i < feature.length; i += 1) {
    h ^= feature.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return { index: h % dimensions, sign: (h >>> 31) & 1 ? 1 : -1 };
}

export function l2normalise(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
