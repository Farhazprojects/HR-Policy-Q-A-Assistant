# Demonstration guide

A 10–15 minute walkthrough for the CQUniversity coordinator. Every step below
has been verified end to end.

## Before you start (5 minutes, done in advance)

```bash
npm install
```

```bash
createdb hr_policy_assistant
```

```bash
npm run db:generate && npm run db:push && npm run seed
```

```bash
npm run dev
```

Open <http://localhost:3000>. Confirm <http://localhost:4000/api/health> reports
`"status": "ok"` and a non-zero `indexedChunks`.

**Reset to a clean demonstration state at any time** (this also un-indexes the
wellbeing policy so step 14 works again):

```bash
npm run seed
```

**Accounts** — password from `SEED_PASSWORD` (default `Capstone#2026`):

| Role | Email |
|---|---|
| Employee | `employee@company.com` |
| HR Officer | `hr@company.com` |
| Administrator | `admin@company.com` |

---

## Part 1 — Employee experience (5 minutes)

### 1. Sign in as the Employee
Point out the branding and the note "Role-based access is demonstrated in this
prototype."

> "This reproduces the approved Figma prototype. The password is bcrypt-hashed
> and the session is a JWT in an httpOnly cookie, so JavaScript can never read
> it."

### 2. Employee Dashboard
Three action cards, recent activity, live acknowledgement count.

> "Every figure here is a database query — nothing is hard-coded."

### 3. Ask a supported question
**Ask AI** → click *"How many days of annual leave are employees entitled to?"*

### 4. The grounded answer
The green **Grounded** badge and the footer "Source-grounded response • No
unsupported policy information used".

> "This answer came only from the indexed policy documents."

### 5. Open the citation
Click the citation card to expand it.

> "Employee Leave Policy, page 2, section 'Annual Leave Entitlements', similarity
> 0.97 — and here is the exact supporting text. The page number is real: chunks
> never span pages, so citations can't drift."

### 6. The Explainability panel
Walk through "Why this answer?", then the metrics: top similarity, chunks
retrieved vs accepted, threshold 0.72, Top-K 4, similarity function.

### 7. Confidence
Expand **"How is confidence calculated?"**.

> "This is the important part academically. We never ask the model how confident
> it is — that number would mean nothing. The application computes it from
> retrieval evidence: 55% top similarity, 25% rank-weighted mean, 10% threshold
> margin, 10% evidence coverage. It measures evidence strength, not a probability
> that the answer is correct."

### 8. Ask an unsupported question
Type: **"What is the company's policy on purchasing private aircraft?"**

### 9. The refusal
Amber **Fallback** badge, the refusal text, and "Why no answer was given" showing
the closest score against the threshold.

> "This is the Responsible AI behaviour the proposal is built around. Nothing
> reached the 0.72 threshold, so the system refused. And note the panel: the
> language model was **not invoked at all** — the refusal is produced by the
> application before any model call. That's both a safety property and a cost
> control."

### 10. Policy Search
Search **annual leave**. Point out matched sections, the highlighted excerpt with
its page and section, and the DEMO DATA badges.

> "These are fictional policies written for this capstone — no real
> organisational documents are used."

### 11. Leave Request
Complete the form → **Review request** → **Submit**.

> "The request is genuinely stored and appears below. We label this honestly as
> prototype scope: there is no payroll or HRIS integration and no entitlement
> balance is calculated."

### 12. Policy Acknowledgements
**Acknowledge** a pending policy, confirm in the dialog.

> "The acknowledgement is stored with a timestamp against this employee and
> written to the audit log."

---

## Part 2 — HR Officer (4 minutes)

### 13. Sign out, sign in as HR Officer
Point out that the sidebar now shows the **HR Officer** group.

> "The employee account never sees these items — and hiding a link isn't access
> control, so the API independently returns 403 and records an ACCESS_DENIED
> audit event."

Open **HR Dashboard**: four live metrics, then the HR tools grid.

> "Draft Generator, Analytics and Notifications carry a PROTOTYPE badge —
> the Figma prototype labels them as placeholders, so we haven't claimed
> otherwise."

### 14. Upload a policy live — the centrepiece
**Upload Policy** → **Choose PDF** →
`src/database/seeds/policies/employee-wellbeing-support-policy.pdf`

Title auto-fills. Set Category `Wellbeing`, then **Upload and index policy**.

Watch the pipeline advance: Uploading → Extracting → Chunking → Generating
embeddings → Indexing. The result panel reports real page and chunk counts.

> "That ran the genuine pipeline: page-aware text extraction, chunking with
> section detection, embedding generation, and indexing. Nothing was staged."

### 15. Ask about the policy you just uploaded
Click **Ask a question about it** → ask:
**"How many counselling sessions does the employee assistance programme provide?"**

> "Grounded, citing the policy that didn't exist in the knowledge base sixty
> seconds ago. That closes the loop from upload to retrieval."

---

## Part 3 — Administrator and architecture (4 minutes)

### 16. Sign in as Administrator
The **Administration** group is now visible.

### 17. AI Governance Dashboard
Policies indexed, AI questions, grounded answers, fallbacks — including the ones
just generated.

> "These update live. The grounding bar shows the split between grounded answers
> and safe refusals, which is exactly the responsible-AI signal an organisation
> would want to monitor."

Walk through Retrieval quality, Access control, Responsible AI, and Active
configuration.

> "Active configuration is deliberately blunt: it states that this demonstration
> is running lexical embeddings and extractive composition, not a generative
> model. If I set `AI_PROVIDER=gemini` with an API key, these badges change and
> the same pipeline calls Gemini instead — no code changes."

Scroll to **Audit activity**.

> "Thirteen event types. Actor, event, timestamp and non-sensitive metadata only
> — question text and policy content are never duplicated into the audit log."

### 18. System Overview
Walk the request flow and the live service status panel.

### 19. Demonstrate the RBAC denial (optional, 30 seconds)
Sign back in as the Employee and navigate directly to `/hr/upload`.

> "The page shell loads, but the API refuses every privileged call and logs the
> attempt. Authorisation is enforced on the server, not in the browser."

---

## Closing summary

> "To summarise: the retrieval pipeline is real — PDFs are extracted page by
> page, chunked with section attribution, embedded and indexed, and every answer
> is grounded in retrieved passages with citations to document, page and section.
> Confidence is calculated by the application from retrieval evidence, never
> self-reported by a model. When the evidence doesn't support an answer, the
> system refuses before calling any model.
>
> The whole thing runs with no API key and no cost, which is why it's
> demonstrable anywhere — and the interface states plainly when it's running the
> local lexical and extractive path rather than a generative model. 59 automated
> tests cover the pipeline, including the five scenarios in the project brief."

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Every question refuses | Knowledge base is empty — run `npm run seed`; check `/api/health` |
| "Could not reach the server" | The API isn't running — `npm run dev -w backend` |
| Upload says "already exists" | You already uploaded it — `npm run seed` to reset |
| Database connection error | `pg_isready`; check `DATABASE_URL` in `.env` |
| Port in use | Change `PORT`, or `npm run dev -w frontend -- -p 3001` |

## Questions an assessor may ask

**"Is the AI actually running, or is this canned?"**
Neither — and the interface says which. By default it runs real retrieval over
real embeddings, then composes the answer *extractively* by quoting retrieved
policy text; the panel labels it "Extractive — quotes policy text, no language
model". Set `AI_PROVIDER=gemini` with a free-tier key and the same pipeline
performs genuine generation.

**"Why not pgvector?"**
It wasn't available on the development PostgreSQL server. Rather than weaken the
design, embeddings sit in a `float8[]` column behind a `VectorStore` interface —
swapping in pgvector is one new class, no calling code changes.

**"How do you know it isn't hallucinating?"**
Two independent guards: the threshold refusal happens before any model call, and
the system prompt forbids unsupported claims and requires an explicit refusal.
Every answer is citation-backed, and citations are stored so past answers stay
auditable.

**"Is 0.72 the optimal threshold?"**
No, and we don't claim it is. It's a prototype configuration value chosen for
interpretability, set by environment variable. Tuning it with evidence would need
a labelled evaluation set, which is listed under future development.

**"Is 89% confidence an accuracy figure?"**
No. It's a measure of retrieval evidence strength — how well the best passage
scored, how far it cleared the threshold, and how many passages corroborated it.
The documentation and the UI both state that it is not a correctness probability.
