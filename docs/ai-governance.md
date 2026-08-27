# AI governance and responsible AI

## 1. Principles

The assistant provides **policy-grounded assistance**. It does not replace HR
professional judgement, and it is designed so that the honest answer "the policy
documents do not cover this" is a first-class outcome rather than a failure.

## 2. Controls

### Grounding
Answers are produced only from passages retrieved from approved policy documents.
The system prompt forbids inventing organisational policy, forbids relying on
general employment-law knowledge, and requires an explicit refusal when the
retrieved context is insufficient.

### Refusal before generation
The relevance threshold is evaluated **before** any model call. If nothing
qualifies, the application returns a fixed refusal and records
`provider.llmModel: "not-invoked"`. A refusal is therefore a property of the
system rather than of a model's compliance, and it behaves identically across
every provider. A second refusal path catches the model replying
`INSUFFICIENT_EVIDENCE`.

### Transparency
Every answer carries: source document, page, section, similarity per citation,
the expandable supporting text, retrieval counts, the threshold in force, the
similarity function, the embedding and generation providers and models, and the
generation mode (`generative` or `extractive`).

### Confidence is measured, not claimed
Confidence is calculated by the application from retrieval evidence and is never
requested from the model. It measures **evidence strength, not correctness
probability**, and the interface says so. Methodology: `architecture/rag-pipeline.md` §9.

### Human oversight
Every answer recommends contacting HR where judgement, approval or personal
circumstances are involved. The governance dashboard exposes fallback rates and
low-confidence answer counts so an administrator can see where the knowledge base
is failing employees.

### Access control
Three roles with server-enforced boundaries. Hiding a navigation link is never
treated as access control — the API independently returns `403` and records an
`ACCESS_DENIED` audit event.

## 3. Audit logging

| Event | Recorded when |
|---|---|
| `LOGIN` / `LOGIN_FAILED` / `LOGOUT` | Authentication attempts |
| `AI_QUERY` | A question is submitted |
| `AI_GROUNDED_RESPONSE` | A grounded answer is returned |
| `AI_FALLBACK` | A refusal is returned |
| `POLICY_UPLOAD` | An HR user uploads a document |
| `POLICY_INDEXED` / `POLICY_INDEX_FAILED` | Ingestion outcome |
| `POLICY_SEARCH` | A non-empty policy search |
| `LEAVE_REQUEST` | A leave request is submitted |
| `POLICY_ACKNOWLEDGED` | An employee acknowledges a policy |
| `ACCESS_DENIED` | A role check fails |

Each record stores actor, event, timestamp, optional entity reference,
non-sensitive metadata and IP address.

**Data minimisation.** Audit metadata holds counts, scores, titles and
identifiers — never question text, answer text or policy content. Audit writes
never block or fail a user request.

## 4. Governance metrics

All computed live from the database (`GET /api/admin/governance`):

- Policies indexed, total, and indexed passage count
- Total questions, grounded answers, fallbacks, errors
- Grounding rate and fallback rate
- Average top-result similarity and average confidence
- Low-confidence grounded answers
- Retrieval threshold, Top-K, similarity function
- Active embedding and generation providers, and whether each is neural /
  generative
- Role distribution and total accounts
- Acknowledgement completion, leave requests, total audit events

Seeded rows are labelled **DEMO DATA**; placeholder features are labelled
**PROTOTYPE**.

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Fabricated policy ("hallucination") | Retrieval-only grounding; threshold refusal before generation; citations on every claim |
| Over-trust in the AI | Confidence shown with its methodology; explicit statement that it does not replace HR judgement; refusal path visible |
| Stale policy answers | Version field, `(title, version)` uniqueness, upload supersedes, acknowledgement resets per version |
| Unauthorised knowledge-base changes | Upload restricted to HR/Admin, audited, PDF-validated, size-limited |
| Sensitive data exposure | Minimal schema; `filePath` never returned; password hashes never returned; audit metadata restricted |
| Confidence misread as accuracy | Labelled "retrieval-based"; HR dashboard states "AI Accuracy" is mean retrieval confidence, not correctness |
| Provider outage or quota exhaustion | Typed 503 with a plain-language message; no fabricated answer on failure; local provider always available |
| Cost overrun | No model call without evidence; no re-embedding unchanged files; capped context and output; rate limits |

## 6. Limitations disclosed to users

The interface itself states that the default local configuration uses **lexical,
not neural** embeddings and **extractive, not generative** answers. The
governance dashboard and System Overview show the active configuration, so a
demonstrator can never inadvertently present extractive output as live AI
generation.
