# HR Policy Q&A Assistant
### Enterprise Knowledge Management System (AI-Powered)

> A capstone project for **COIT20254 – Information Systems Project**, CQUniversity Australia.

[![CI](https://github.com/Farhazprojects/HR-Policy-Q-A-Assistant/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Farhazprojects/HR-Policy-Q-A-Assistant/actions/workflows/ci.yml)

---

## 1. Overview

The **HR Policy Q&A Assistant** lets employees ask natural-language questions about HR policy — leave entitlements, workplace conduct, onboarding, benefits — and receive answers grounded in the organisation's actual policy documents.

The chatbot is deliberately framed as **one interface into a larger Enterprise Knowledge Management System (EKMS)**, not the product itself. The underlying system — document ingestion, retrieval, versioned knowledge base, analytics — is designed so the same knowledge layer could later power a search portal, an internal API, or a Slack/Teams bot, without re-architecting.

This distinction shapes every decision in this repository: the codebase is organised by **capability** (`ai/`, `backend/`, `frontend/`) rather than by "chatbot feature," so the knowledge layer stays reusable.

## 2. Problem This Solves

New and existing employees routinely ask HR the same questions (leave balances, parental leave, WFH policy, grievance procedures) that are already answered somewhere in a handbook nobody reads end-to-end. This creates repetitive workload for HR staff and inconsistent answers for employees. A retrieval-grounded assistant reduces both, while keeping a human-reviewable trail back to the source policy (critical for compliance — HR answers cannot hallucinate).

## 3. Architecture at a Glance

```
Employee ── Chat UI / Web Portal ── Backend API ── RAG Orchestrator ── Vector Store ── HR Policy Documents
                                         │
                                         └── LLM Provider (pluggable) ── Grounded Answer + Source Citation
```

Full diagrams: [`docs/architecture/system-architecture.md`](docs/architecture/system-architecture.md)

**Why this shape:** every enterprise RAG system separates *retrieval* (which documents are relevant) from *generation* (turning retrieved text into an answer). Coupling them makes the system impossible to evaluate or swap providers later — a core requirement here since the brief calls for **multiple LLM providers** and **AI evaluation** as future capabilities.

## 4. Repository Structure

```
hr-policy-qa-assistant/
├── .github/              GitHub configuration — issue/PR templates, CI workflows, CODEOWNERS
├── docs/                 All non-code deliverables
│   ├── architecture/     System architecture, UML, BPMN, RAG pipeline, API, database
│   ├── testing/          Test strategy, test cases, traceability matrix
│   ├── requirements/     User stories, prototype implementation spec
│   ├── meeting-minutes/  Weekly team meeting records
│   └── presentations/    Slide decks and speaking scripts
├── src/
│   ├── ai/                        AI/RAG layer
│   │   ├── rag/                   Tokenizer, PDF extraction, page-aware chunking
│   │   ├── vector-store/          Embedding storage and similarity search
│   │   ├── llm-providers/         Adapter layer — Gemini · Ollama · local
│   │   ├── prompt-management/     Grounding prompt and refusal wording
│   │   ├── evaluation/            Retrieval-derived confidence scoring
│   │   └── knowledge-base-versioning/  Checksum and revision rules
│   ├── backend/           API server, business logic, middleware
│   ├── frontend/          Employee-facing chat and admin UI
│   ├── database/          Schema, client, migrations, seed data
│   └── analytics/         Usage analytics dashboard (future SaaS phase)
├── tests/                 unit · integration · e2e · shared fixtures
├── deployment/            Docker, CI/CD pipelines, infrastructure-as-code
├── CONTRIBUTING.md        Branching strategy, commit convention, PR process
├── CODE_OF_CONDUCT.md     Team conduct standards
├── SECURITY.md            Vulnerability reporting and data-handling policy
├── ROADMAP.md             Project roadmap across the trimester and beyond
└── LICENSE
```

**Why organise `src/` by capability instead of by "chatbot":** the assessment brief explicitly asks for the repo to be SaaS-ready and to anticipate RAG, vector databases, multiple LLM providers, evaluation, and an analytics dashboard. Creating these folders in Phase 1 — even empty — meant the architecture did not need to be renegotiated when those features were actually built. The implementation landed into that structure unchanged, which is the clearest evidence the original decision was sound.

Layers are addressed through path aliases — `@ai/*`, `@backend/*`, `@db/*` — so a file can move within a capability without editing its consumers, and every import states which boundary it crosses.

## 5. Team

| Member | Role | Focus |
|---|---|---|
| Farhaz Khondoker | AI Lead / Solution Architect / Full Stack Developer / Technical Lead | Architecture, AI integration, backend, frontend, database, deployment, security, repo management |
| Isuru Koswaththa | Business Analyst | Requirements, stakeholder analysis, WBS, Gantt chart, risk register, quality plan, UAT coordination |
| Dineli Jayandee Gampolage | Systems Analyst / Documentation Lead | UML/BPMN diagrams, user stories, requirements, test cases, user manual, presentation prep, final report |

Full task allocation is recorded in the Assessment 1 documentation.

## 6. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript | App Router for server components and routing; strong typing shares request/response shapes with the backend rather than duplicating them |
| Backend | Node.js + Express + TypeScript | One language across frontend, backend and AI layer removes a context switch for the team and lets types be shared end to end |
| Database | PostgreSQL 16 | Relational integrity for users, policies and audit records, with embeddings held alongside them rather than in a second system |
| ORM | Prisma 6 | Typed schema and client generated from a single source of truth, so entity changes surface at compile time |
| PDF processing | pdfjs-dist | Page-by-page extraction, which is what lets every citation carry a real page number rather than an estimate |
| Vector store | `VectorStore` interface over PostgreSQL `float8[]` | Keeps infrastructure to one database; the interface means a pgvector or dedicated vector database implementation is a swap, not a rewrite |
| AI generation | Provider adapter — Gemini · Ollama · local | The brief requires multiple LLM providers; an adapter avoids vendor lock-in and lets the system run with no API key |
| Embeddings | Provider adapter — Gemini · Ollama · local | Chosen independently of the generation provider |
| Auth | bcrypt + JWT in an httpOnly cookie | The session token is never readable by JavaScript |
| Testing | Vitest + Supertest | Runs the real API and the real pipeline rather than mocking them |

**Why the AI layer is provider-agnostic.** `EmbeddingProvider` and `LLMProvider`
are interfaces; the pipeline never references a vendor. The system therefore runs
with no API key at all, provider choice is an environment variable, and the
retrieval pipeline is implemented directly — extraction, chunking, embedding,
similarity, thresholding and confidence are all readable in `src/ai/` rather than
delegated to a framework that would hide the work being assessed.

## 7. Getting Started

**Requirements:** Node.js 20+, PostgreSQL 16+.

```bash
git clone https://github.com/Farhazprojects/HR-Policy-Q-A-Assistant.git
cd HR-Policy-Q-A-Assistant
npm install
```

```bash
createdb hr_policy_assistant
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` (with your PostgreSQL user) and `JWT_SECRET`.
Every variable is documented inline. Then:

```bash
npm run setup
```

`setup` generates the Prisma client, applies the schema and seeds the knowledge
base — six fictional HR policies rendered to PDF and ingested **through the real
pipeline** (extract → chunk → embed → index), plus three role accounts.

```bash
npm run dev
```

Frontend on <http://localhost:3000>, API on <http://localhost:4000>.

### No API key required

The system runs offline with **no paid subscription and no API key**. Retrieval
uses a deterministic lexical vector-space model and answers are composed
*extractively* by quoting retrieved policy text — labelled as such in the
interface, never presented as generative output. Set `AI_PROVIDER=gemini` with a
free-tier key, or `ollama` for local models, and the same pipeline generates.

### Demonstration accounts

Password is set by `SEED_PASSWORD` in `.env` (default `Capstone#2026`) and printed
by `npm run seed`. Local demonstration accounts only.

| Role | Email |
|---|---|
| Employee | `employee@company.com` |
| HR Officer | `hr@company.com` |
| Administrator | `admin@company.com` |

### Common commands

```bash
npm test           # 59 automated tests
npm run typecheck  # server + frontend
npm run build      # production build
npm run db:studio  # browse the database
npm run probe      # retrieval diagnostic — similarity scores per question
```

### Documentation

| Document | Contents |
|---|---|
| [`architecture/implementation-architecture.md`](docs/architecture/implementation-architecture.md) | As-built architecture and design decisions |
| [`architecture/rag-pipeline.md`](docs/architecture/rag-pipeline.md) | Retrieval, thresholds, confidence methodology |
| [`architecture/database-design.md`](docs/architecture/database-design.md) | Entities, relationships, indexes |
| [`architecture/api-reference.md`](docs/architecture/api-reference.md) | REST API reference |
| [`testing/test-strategy.md`](docs/testing/test-strategy.md) | Test strategy and results |
| [`testing/traceability-matrix.md`](docs/testing/traceability-matrix.md) | Feature → UI → API → entity → test |
| [`ai-governance.md`](docs/ai-governance.md) | Responsible AI controls and audit logging |
| [`demo-guide.md`](docs/demo-guide.md) | Step-by-step demonstration script |
| [`requirements/prototype-implementation-spec.md`](docs/requirements/prototype-implementation-spec.md) | Figma prototype inspection and derived spec |

### Known limitations

Stated plainly, since the project is assessed on the honesty of its claims as much
as its functionality: the default embedding model is lexical rather than semantic;
default generation is extractive rather than generative; leave requests are stored
but not processed (no approval workflow or payroll integration); retrieval
parameters are prototype configuration values (`TOP_K=4`; the threshold is
calibrated per embedding model — 0.72 lexical, 0.61 Gemini — from measured score
separation on the seeded corpus rather than from an accuracy study); scanned image-only PDFs are unsupported (no OCR); and the
deployment is single-tenant and local. Full list in
[`implementation-architecture.md`](docs/architecture/implementation-architecture.md)
and the governance document.

### Academic integrity

All policy documents are **fictional**, written for this capstone, describing an
invented organisation. No real organisational HR documentation is included. No
accuracy percentage, user count or production deployment is claimed. Figures in
the interface are computed live from the database; seeded rows are labelled
**DEMO DATA** and placeholder features **PROTOTYPE**.

## 8. Assessment Deliverables

Assessment 1 documents are submitted through Moodle. Implementation deliverables live in [`docs/`](docs/), one file per artefact, so markers and teammates can find any of them without searching.

## 9. License

MIT — see [`LICENSE`](LICENSE).

## 10. Security

See [`SECURITY.md`](SECURITY.md) for how to report vulnerabilities and how HR policy data is handled.
