# API reference

Base URL `http://localhost:4000`. The frontend calls these through a same-origin
`/api` proxy.

**Authentication.** `POST /api/auth/login` sets an `httpOnly` `token` cookie. The
API also accepts `Authorization: Bearer <token>` (used by the test suite).

**Errors.** Every failure returns:

```json
{ "error": { "code": "FORBIDDEN", "message": "Human-readable explanation." } }
```

| Status | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Not signed in, or session expired |
| 403 | Signed in but not permitted for this role |
| 404 | Not found |
| 413 | Upload too large |
| 422 | Ingestion failed |
| 429 | Rate limited |
| 500 | Unexpected error (generic message; no stack trace) |
| 503 | AI provider unavailable or quota exhausted |

---

## Authentication

### `POST /api/auth/login`
```json
{ "email": "employee@company.com", "password": "…" }
```
→ `200` `{ "user": { "id","email","name","role","jobTitle","department" }, "token": "…" }`
→ `401` on bad credentials (identical message whether or not the account exists).

### `POST /api/auth/logout`
→ `200` `{ "success": true }` and clears the cookie.

### `GET /api/auth/me`
→ `200` `{ "user": … }` · `401` if not signed in.

---

## Chat (RAG)

### `POST /api/chat`
Rate limit 20/min. Body `{ "question": "string, 3–1000 chars" }`.

```json
{
  "questionId": "clx…",
  "question": "How many days of annual leave are employees entitled to?",
  "answer": "According to the Employee Leave Policy (page 2, …",
  "status": "GROUNDED",
  "citations": [{
    "id": "…", "chunkId": "…", "documentId": "…",
    "documentTitle": "Employee Leave Policy",
    "page": 2, "section": "Annual Leave Entitlements",
    "excerpt": "Permanent full-time employees are entitled to 20 days…",
    "similarity": 0.973, "rank": 1
  }],
  "explainability": {
    "confidence": 0.89, "confidencePercentage": 89, "confidenceBand": "HIGH",
    "topSimilarity": 0.973, "meanSimilarity": 0.973,
    "retrievedCount": 4, "acceptedCount": 1,
    "threshold": 0.72, "topK": 4,
    "similarityFunction": "idf-weighted-query-coverage",
    "whyRelevant": "…scored 0.97 against the 0.72 threshold…",
    "methodology": "Computed by the application from retrieval evidence…",
    "components": { "topSimilarity": 0.973, "weightedMean": 0.973,
                    "thresholdMargin": 0.905, "evidenceCoverage": 0.25 }
  },
  "provider": {
    "llm": "local", "llmModel": "extractive-composer-v1",
    "embedding": "local", "embeddingModel": "local-lexical-tfidf-v1",
    "generationMode": "extractive", "isNeuralEmbedding": false, "demoMode": true
  },
  "latencyMs": 12
}
```

On the refusal path: `status: "FALLBACK"`, `citations: []`,
`provider.llmModel: "not-invoked"`, and `fallbackReason` explaining the closest
score against the threshold. **The language model is not called.**

### `GET /api/chat/history?limit=20`
Returns the signed-in user's questions with citations. Users see only their own.

---

## Policies

### `GET /api/policies`
All `INDEXED` policies with metadata. `filePath` is never included.

### `GET /api/policies/search?q=annual+leave`
Semantic + lexical search over the indexed knowledge base.

```json
{ "query": "annual leave", "results": [{
  "id": "…", "title": "Employee Leave Policy", "category": "Leave & Entitlements",
  "version": "4.2", "summary": "…", "pageCount": 4, "chunkCount": 11,
  "isDemo": true, "relevantSections": ["Annual Leave Entitlements", "…"],
  "bestMatch": { "page": 2, "section": "Annual Leave Entitlements",
                 "excerpt": "…", "similarity": 0.972 },
  "score": 0.972
}] }
```

An empty `q` returns every indexed policy.

### `GET /api/policies/:id`
Full policy including all chunks (page, section, content). No `filePath`.

### `GET /api/policies/:id/status`
Processing status — for polling during ingestion.

### `POST /api/policies/upload` · **HR Officer / Admin**
`multipart/form-data`, rate limit 10/min, max 20 MB.

| Field | Required | Notes |
|---|---|---|
| `file` | yes | PDF only |
| `title` | yes | 3–150 chars |
| `category`, `version`, `summary` | no | |
| `requiresAcknowledgement` | no | `"true"` assigns for acknowledgement |

→ `201`
```json
{ "document": { "documentId": "…", "title": "…", "pageCount": 2,
                "chunkCount": 6, "status": "INDEXED",
                "embeddingModel": "local-lexical-tfidf-v1" } }
```
The document is retrievable by Ask AI and Policy Search immediately.
`403` for an employee; `400` for a non-PDF, a duplicate file or a duplicate
`(title, version)`.

### `DELETE /api/policies/:id` · **HR Officer / Admin**
Removes the document, its chunks and embeddings.

---

## Leave

### `GET /api/leave` · `POST /api/leave` · `GET /api/leave/:id`

```json
{ "leaveType": "ANNUAL", "startDate": "2026-09-14",
  "endDate": "2026-09-18", "reason": "Family commitments" }
```
→ `201` with `totalDays` (inclusive calendar days) and `status: "SUBMITTED"`.
Users may only read their own requests.

---

## Acknowledgements

### `GET /api/acknowledgements`
`{ "pending": [...], "completed": [...], "pendingCount": n, "completedCount": n }`

### `POST /api/acknowledgements/:policyId`
Records the acknowledgement with a timestamp. `400` if already acknowledged;
`404` if the policy was never assigned to this user.

---

## Dashboards

### `GET /api/dashboard`
Employee dashboard counts and most recent question.

### `GET /api/hr/dashboard` · **HR Officer / Admin**
`metrics` (policies indexed, questions, acknowledgement rate, mean confidence),
`recentUploads`, `recentQuestions`.

### `GET /api/admin/governance` · **Admin**
Live governance metrics: `knowledgeBase`, `ai`, `retrieval`, `generation`,
`accessControl`, `activity`, `demoDataPresent`, `generatedAt`. Every figure is a
database query.

### `GET /api/admin/activity?limit=25` · **Admin**
Recent audit events with actor and role.

---

## Health

### `GET /api/health` — unauthenticated
Reports indexed chunk count, retrieval configuration, and the reachability of the
configured embedding and generation providers.
