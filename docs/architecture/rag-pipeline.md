# Retrieval-Augmented Generation

How a question becomes a grounded, cited, confidence-scored answer — and how the
system decides to refuse instead.

## 1. Pipeline

```
Employee question
      ↓
Validation (3–1000 characters)
      ↓
Query embedding                      ← EmbeddingProvider
      ↓
Vector similarity search (TOP_K)     ← VectorStore
      ↓
Relevance threshold filter           ← RETRIEVAL_THRESHOLD
      ↓
   ┌──────────────┴──────────────┐
   │ nothing passes              │ at least one passes
   ▼                             ▼
REFUSAL                    Context assembly (max MAX_CONTEXT_CHUNKS)
(no LLM call)                    ↓
   │                        Grounded generation   ← LLMProvider
   │                             ↓
   │                        Model may still refuse (INSUFFICIENT_EVIDENCE)
   └──────────────┬──────────────┘
                  ▼
       Confidence calculation (from retrieval evidence)
                  ▼
       Persist Question + Citations + AuditLog
                  ▼
       Response with answer, citations, explainability
```

Implementation: `src/backend/services/ragService.ts`.

## 2. Ingestion

`src/backend/services/documentService.ts`

1. **Validate** — magic-number check (`%PDF-`), size limit, MIME/extension check.
2. **Deduplicate** — SHA-256 of the file bytes. An identical file is rejected
   rather than re-embedded, and a duplicate `(title, version)` is rejected. This
   is the "do not regenerate embeddings for unchanged documents" cost control.
3. **Extract** — `pdfjs-dist` (pinned to 3.x for its CommonJS build) reads the
   document **page by page**, so every chunk
   carries a real page number. Line structure is rebuilt from the `hasEOL` flag,
   which is what allows headings to survive extraction.
4. **Chunk** — page-aware, section-attributed (below).
5. **Embed** — batched through the active `EmbeddingProvider`.
6. **Store** — chunks and vectors written to PostgreSQL; document marked
   `INDEXED`; the vector index is invalidated so the document is retrievable
   immediately.

Document status advances `UPLOADED → EXTRACTING → CHUNKING → EMBEDDING →
INDEXED`, or `FAILED` with a message. A failed ingestion deletes the stored file
and records a `POLICY_INDEX_FAILED` audit event.

## 3. Chunking

`src/ai/rag/chunker.ts`

- **Chunks never span pages.** A citation's page number is therefore always
  correct, never interpolated.
- **Section headings are detected** by three patterns: numbered headings
  (`4.1 Annual Leave`), `SECTION`/`PART`/`APPENDIX` prefixes, and ALL-CAPS lines.
  A candidate is rejected if it reads like a sentence (ends in punctuation, or
  exceeds ten words).
- The current heading **carries forward** across page boundaries, so a passage
  under "4. Annual Leave" is attributed correctly even when the heading appeared
  on the previous page.
- Blocks longer than `CHUNK_TARGET_CHARS` (default 900) are split on **sentence
  boundaries** with a `CHUNK_OVERLAP_CHARS` (default 150) sliding overlap, so a
  rule split across a boundary still appears whole in one chunk.
- Fragments under 60 characters are discarded as unusable evidence.

## 4. Embedding providers

`src/ai/llm-providers/embedding/`

Every provider implements one interface and declares its own similarity function,
so the pipeline is unchanged when the provider changes.

| Provider | Model | Type | Similarity |
|---|---|---|---|
| `local` (default) | `local-lexical-tfidf-v1` | Lexical, deterministic | IDF-weighted query coverage |
| `gemini` | `gemini-embedding-001` | Neural | Cosine |
| `ollama` | `nomic-embed-text` | Neural | Cosine |

### The local lexical model — stated plainly

This is a **vector space model, not a learned neural embedding**. It matches
wording, not meaning. It exists so the complete pipeline is demonstrable with no
API key, no network and no cost. The interface reports
"Lexical embeddings" and names the model with every answer; it is never presented
as semantic understanding.

**Vectors.** Unigrams and adjacent bigrams are hashed into a fixed
512-dimensional space (FNV-1a feature hashing with a sign bit), weighted by
sublinear term frequency `(1 + log tf)` and smoothed IDF, then L2-normalised.
Feature hashing keeps vectors stable as the corpus grows, which a fixed
vocabulary would not.

**Similarity.** Raw cosine between a short question and a ~900-character passage
is dominated by the passage's other content, which makes a single interpretable
threshold impossible. The local provider therefore declares a different, equally
well-defined similarity:

```
score = 0.85 · unigramCoverage + 0.10 · bigramCoverage + 0.05 · cosine

unigramCoverage = Σ IDF(t) for query terms t present in the passage
                  ─────────────────────────────────────────────────
                  Σ IDF(t) for all query terms t
```

`unigramCoverage` answers a question with a plain meaning: *how much of this
question's informative vocabulary does this passage actually support?* It lives
on a genuine 0–1 scale, so `RETRIEVAL_THRESHOLD = 0.72` carries the same
intuition ("about three-quarters supported") as it does for cosine providers.
Bigrams contribute a small precision bonus rather than a penalty, because
requiring exact adjacent pairs would punish ordinary rephrasing ("employees are
entitled" vs "employee entitlement"). Cosine breaks ties between passages with
equal coverage.

**Stopwords.** In addition to ordinary function words, interrogative and
quantifier words (`many`, `much`, `need`, `want`, …) are removed. They shape a
question but appear nowhere in policy prose, so retaining them would penalise
otherwise perfect matches. This is a retrieval decision, not a threshold
adjustment: the threshold is unchanged at the value specified for the project.

## 5. Vector store

`src/ai/vector-store/vectorStore.ts`

Embeddings are stored in a `float8[]` column and similarity is evaluated in the
service layer against an in-memory snapshot of the index, behind a `VectorStore`
interface. Keeping the vectors in the same database as the records they describe
avoids running a second piece of infrastructure for a corpus of this size:

```ts
interface VectorStore {
  search(query: string, queryVector: number[], topK: number): Promise<SearchHit[]>;
  invalidate(): void;
  size(): Promise<number>;
}
```

Replacing this with a pgvector-backed store is a single new class; no calling
code changes. The snapshot is invalidated whenever a document is added or
removed, which is what makes a freshly uploaded policy retrievable immediately.

**Limitation:** the in-memory scan is O(n) per query. That is entirely adequate
for a corpus of this size and would not be for a large production corpus.

## 6. Threshold and the refusal path

`TOP_K = 4`. The relevance threshold is **a property of the embedding model, not
of the application**, because similarity scores are not comparable across models.
Each provider declares the value calibrated for its own scale, resolved at query
time by `getActiveThreshold()` and overridable with `RETRIEVAL_THRESHOLD`:

| Provider | Similarity function | Threshold | Basis |
|---|---|---|---|
| `local` | IDF-weighted query coverage | **0.72** | supported 0.918–0.976, unsupported ~0.265 |
| `gemini` | cosine | **0.61** | supported 0.618–0.889, unsupported 0.448–0.603 |
| `ollama` | cosine | 0.60 | not yet calibrated; conservative starting point |

These are measured on the seeded corpus with `npm run calibrate`, not assumed.
Carrying the lexical 0.72 across to Gemini rejects almost every valid question,
because Gemini's scores occupy a lower and much narrower band.

**The two models fail in opposite directions, and the numbers say so.** The
lexical scorer separates answerable from unanswerable questions by a margin of
roughly 0.65, but cannot connect "vacation days" to "annual leave" at any
threshold — the vocabulary simply does not overlap. Gemini reaches the correct
passage for every phrasing tried, but separates the two classes by only 0.015.
Better retrieval and better separation are not the same property, and this
system does not claim the second from evidence of the first.

The narrow Gemini margin is the reason the post-generation refusal below matters
more in that mode: the threshold alone is a weaker guard there.

When no retrieved chunk reaches the threshold:

- **The language model is not called at all.** The refusal is produced by the
  application.
- The response is `status: FALLBACK`, `citations: []`,
  `provider.llmModel: "not-invoked"`.
- The answer is the fixed text: *"I could not find sufficient information in the
  approved HR policy documents to answer this question. Please contact HR for
  clarification."*
- `fallbackReason` states the closest score against the threshold.
- An `AI_FALLBACK` audit event is written.

This serves two requirements simultaneously: Responsible AI (never invent policy)
and cost control (no wasted API call on an unanswerable question).

A second refusal path exists after generation: the system prompt instructs the
model to reply `INSUFFICIENT_EVIDENCE: …` when the retrieved context does not
support an answer. That reply is detected and converted to a `FALLBACK` result.

### Observed separation

With the seeded corpus and the default local provider, rank-1 scores were:

| Question | Rank-1 score | Outcome |
|---|---|---|
| How many days of annual leave are employees entitled to? | 0.975 | Grounded |
| What is the process for requesting flexible work? | 0.976 | Grounded |
| Do employees need to acknowledge the information security policy? | 0.968 | Grounded |
| What are the requirements for remote work? | 0.969 | Grounded |
| How do I report a security incident? | 0.918 | Grounded |
| **What is the company's policy on purchasing private aircraft?** | **0.265** | **Refused** |

Reproduce with `npm run probe`, `npm run phrasing` (wording sensitivity) and
`npm run calibrate` (threshold separation). These are retrieval scores on the
seeded corpus, not an accuracy claim.

## 7. Grounded generation

`src/ai/prompt-management/prompt.ts` — the system prompt instructs the model to answer
only from supplied context, never to infer organisational policy, never to rely
on general employment-law knowledge, to refuse explicitly when evidence is
insufficient, and to recommend contacting HR where judgement is required.

Retrieved context is supplied as labelled blocks:

```
[SOURCE 1] Document: Employee Leave Policy | Page: 2 | Section: Annual Leave Entitlements
<chunk text>
```

Generation temperature is 0.2 to keep answers close to the source text.

## 8. Citations

Every accepted chunk becomes a `Citation` row:

```json
{
  "documentTitle": "Employee Leave Policy",
  "page": 2,
  "section": "Annual Leave Entitlements",
  "chunkId": "…",
  "similarity": 0.973,
  "rank": 1,
  "excerpt": "Permanent full-time employees are entitled to 20 days…"
}
```

The interface renders these as expandable cards; opening one reveals the exact
supporting policy text. Citations are stored, not merely displayed, so the
evidence behind any past answer remains auditable.

## 9. Confidence — calculated, never self-reported

`src/ai/evaluation/confidence.ts`

**The language model is never asked how confident it is.** Confidence is computed
by the application from retrieval evidence alone, which is why it means the same
thing regardless of which provider is configured.

```
confidence = 0.55 · topSimilarity
           + 0.25 · rankWeightedMeanSimilarity
           + 0.10 · thresholdMargin
           + 0.10 · evidenceCoverage

thresholdMargin  = clamp01((topSimilarity − threshold) / (1 − threshold))
evidenceCoverage = clamp01(acceptedChunks / TOP_K)
rankWeightedMean = Σ(similarityᵢ / rankᵢ) / Σ(1 / rankᵢ)
```

- **topSimilarity** dominates: the strength of the single best piece of evidence.
- **rankWeightedMean** rewards consistent support across several passages.
- **thresholdMargin** measures how far the best evidence clears the bar, so a
  score that only just passes does not read as certainty.
- **evidenceCoverage** distinguishes an answer resting on one passage from one
  corroborated by several.

Bands: **HIGH** ≥ 0.80, **MEDIUM** ≥ 0.60, otherwise **LOW**.

The weights are prototype configuration values chosen for interpretability. No
claim is made that they are optimal, and the figure is a measure of *retrieval
evidence strength*, **not** a probability that the answer is correct. The
interface states this in the explainability panel.

## 10. Cost control

1. Retrieve first; call the model only when evidence exists.
2. Never re-embed an unchanged document (SHA-256 checksum).
3. Cache the vector index in memory, invalidated only on corpus change.
4. Context capped at `MAX_CONTEXT_CHUNKS` (default 6).
5. `maxOutputTokens` capped at 800.
6. Rate limits: 20 AI questions per minute per client.
7. The default configuration makes no external API calls whatsoever.
