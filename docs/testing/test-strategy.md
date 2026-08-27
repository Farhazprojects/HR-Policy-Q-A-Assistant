# Testing

## 1. Running the tests

```bash
npm test
```

Tests run against a dedicated `hr_policy_assistant_test` database, so the
demonstration data is never disturbed. Create it once:

```bash
createdb hr_policy_assistant_test
```

```bash
DATABASE_URL="postgresql://USER@localhost:5432/hr_policy_assistant_test?schema=public" npx prisma db push --schema src/database/schema.prisma
```

## 2. Results

Last run: **59 tests across 5 suites — all passing** (5.21 s).

| Suite | Tests | Covers |
|---|---|---|
| `tests/integration/auth.test.ts` | 8 | Sign-in, httpOnly cookie, account enumeration resistance, token tampering, audit of failures |
| `tests/integration/rbac.test.ts` | 8 | Role boundaries for employee / HR / admin, `ACCESS_DENIED` auditing |
| `tests/unit/ingestion.test.ts` | 11 | PDF extraction, invalid and empty files, page-aware chunking, section detection, embedding determinism and normalisation, end-to-end indexing, duplicate rejection |
| `tests/unit/rag.test.ts` | 12 | Grounded answers, refusal path, no-LLM-call proof, evidence persistence, audit events, validation, history isolation, confidence calculation |
| `tests/integration/features.test.ts` | 20 | Policy search, leave workflow, acknowledgements, upload→searchable→retrievable, governance metric correctness |

## 3. The five mandated test scenarios

### TEST 1 — Supported question returns a grounded answer
`tests/unit/rag.test.ts` → *"answers a supported question with a grounded, cited response"*

Asserts `status === 'GROUNDED'`, at least one citation, the citation names the
Employee Leave Policy with a real page and section, similarity ≥ threshold, and
the answer text actually contains the policy's figure (`20 days`).

### TEST 2 — Unsupported question triggers the fallback
`tests/unit/rag.test.ts` → *"refuses an unsupported question instead of inventing an answer"*

Asserts `status === 'FALLBACK'`, zero citations, the refusal wording, and a
populated `fallbackReason`. A companion test asserts
`provider.llmModel === 'not-invoked'`, proving the model is never called.

### TEST 3 — Uploaded policy becomes searchable
`tests/integration/features.test.ts` → *"indexes an uploaded policy and immediately answers questions from it"*

Uploads the wellbeing policy as HR, asserts `201` and `status: INDEXED`, then
asserts the document appears in `GET /api/policies/search`.

### TEST 4 — New policy is retrieved by the RAG pipeline
Same test. It first asks a wellbeing question and asserts `FALLBACK` (nothing
indexed yet), then re-asks after upload and asserts `GROUNDED` with the citation
naming the new document and the answer containing `6 counselling sessions`. This
is the strongest single demonstration that ingestion feeds retrieval.

### TEST 5 — Employee attempting an HR-only operation is denied
`tests/integration/rbac.test.ts` → *"denies an employee the HR policy upload endpoint"*

Asserts `403` / `FORBIDDEN`, with companion tests for the HR dashboard, the admin
governance dashboard, HR-officer-to-admin escalation, and `ACCESS_DENIED`
auditing.

## 4. Retrieval diagnostic

```bash
npx tsx scripts/demo/probe-retrieval.ts
```

Prints rank-1..4 similarity for each demonstration question, marking which pass
the threshold. Useful for showing an assessor the score separation between
answerable and unanswerable questions.

## 5. Manual test procedures

| # | Procedure | Expected |
|---|---|---|
| M1 | Sign in as each of the three accounts | Sidebar shows only that role's groups |
| M2 | As employee, visit `/hr/upload` directly | Page loads but the API returns 403; no upload is possible |
| M3 | Ask "How many days of annual leave are employees entitled to?" | Grounded answer, citation to page 2 / Annual Leave Entitlements, HIGH confidence |
| M4 | Expand the citation card | Supporting policy text is revealed |
| M5 | Ask the private-aircraft question | Refusal, amber Fallback badge, reason shown, no citations |
| M6 | Search "annual leave" | Employee Leave Policy ranks first with matched sections and highlighted excerpt |
| M7 | Submit a leave request | Review dialog, then the request appears in "Your requests" |
| M8 | Acknowledge a pending policy | Confirmation dialog, toast, list updates, completed count increments |
| M9 | As HR, upload `employee-wellbeing-support-policy.pdf` | Pipeline steps advance; pages and chunks reported; status Indexed |
| M10 | Ask about the employee assistance programme | Grounded answer citing the newly uploaded policy |
| M11 | As admin, open AI Governance | Metrics reflect the questions just asked |
| M12 | Upload a `.txt` file renamed to `.pdf` | Rejected with a clear message |
| M13 | Resize to mobile width | Sidebar collapses behind a menu button; layouts stack |
| M14 | Tab through the login form | Visible focus rings; form submits on Enter |

## 6. Error handling verified

| Condition | Behaviour |
|---|---|
| API not running | "Could not reach the server…" — no stack trace |
| Invalid credentials | Identical message for unknown user and wrong password |
| Missing `GEMINI_API_KEY` with `AI_PROVIDER=gemini` | 503 naming the fix and the local fallback |
| Gemini quota exhausted (429) | 503 suggesting retry or switching provider |
| Ollama not running | 503 naming the base URL and the fallback |
| Corrupt / image-only PDF | 400 explaining OCR is out of scope |
| Empty PDF | 400 |
| Oversized upload | 413 |
| Duplicate file or version | 400 naming the existing document |
| Unhandled exception | Generic 500, logged server-side only |
