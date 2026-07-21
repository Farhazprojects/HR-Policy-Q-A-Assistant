# HR Policy Q&A Assistant
### Enterprise Knowledge Management System (AI-Powered)

> A capstone project for **COIT20254 – Information Systems Project**, CQUniversity Australia.

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
├── docs/                 All non-code deliverables (see docs/README below)
│   ├── architecture/     System architecture, UML, BPMN, data flow diagrams
│   ├── testing/          Test cases and UAT scripts
│   ├── meeting-minutes/  Weekly team meeting records
│   └── presentations/    Slide decks and speaking scripts
│   └── requirements/     User Stories
├── src/
│   ├── ai/                        AI/RAG layer (see src/ai/README.md)
│   │   ├── rag/                   Retrieval-augmented generation pipeline
│   │   ├── vector-store/          Embedding storage and similarity search
│   │   ├── llm-providers/         Adapter layer for interchangeable LLMs
│   │   ├── prompt-management/     Versioned prompt templates
│   │   ├── evaluation/            AI response quality evaluation harness
│   │   └── knowledge-base-versioning/  Policy document version control
│   ├── backend/           API server, business logic, data models
│   ├── frontend/          Employee-facing chat and admin UI
│   ├── database/          Schema migrations and seed data
│   └── analytics/         Usage analytics dashboard (future SaaS phase)
├── tests/                 Unit, integration, and end-to-end tests
├── deployment/            Docker, CI/CD pipelines, infrastructure-as-code
├── CONTRIBUTING.md        Branching strategy, commit convention, PR process
├── CODE_OF_CONDUCT.md     Team conduct standards
├── SECURITY.md            Vulnerability reporting and data-handling policy
├── ROADMAP.md             Project roadmap across the trimester and beyond
└── LICENSE
```

**Why organise `src/` by capability instead of by "chatbot":** the assessment brief explicitly asks for the repo to be SaaS-ready and to anticipate RAG, vector databases, multiple LLM providers, evaluation, and an analytics dashboard. Pre-creating these folders now — even empty — means the architecture doesn't need to be renegotiated when those features are actually built in a later trimester or as a commercial extension. It also gives each less-technical team member a clear, bounded place to contribute documentation without needing to understand the whole codebase.

## 5. Team

| Member | Role | Focus |
|---|---|---|
| Farhaz Khondoker | AI Lead / Solution Architect / Full Stack Developer / Technical Lead | Architecture, AI integration, backend, frontend, database, deployment, security, repo management |
| Isuru Koswaththa | Business Analyst | Requirements, stakeholder analysis, WBS, Gantt chart, risk register, quality plan, UAT coordination |
| Dineli Jayandee Gampolage | Systems Analyst / Documentation Lead | UML/BPMN diagrams, user stories, requirements, test cases, user manual, presentation prep, final report |

Full task allocation: [`docs/github-setup-guide.md`](docs/github-setup-guide.md#task-allocation)

## 6. Tech Stack (Proposed)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Team already has front-end experience; strong typing reduces integration bugs across a 3-person team |
| Backend | Python (FastAPI) | Fastest path to both a REST API and native AI/RAG library support (LangChain, LlamaIndex) |
| Database | PostgreSQL | Relational integrity for users/policies + `pgvector` extension for embeddings, avoiding a second database in Assessment 1 |
| Vector Store | pgvector (MVP) → dedicated vector DB (future) | Keeps infrastructure to one database initially; documented upgrade path in `src/ai/vector-store/README.md` |
| LLM Provider | Provider-agnostic adapter (`src/ai/llm-providers/`) | Assessment brief requires "multiple LLM providers" — an adapter interface avoids vendor lock-in |
| Deployment | Docker + GitHub Actions | Reproducible builds; free for university/education accounts |

## 7. Getting Started

> Populated once initial scaffolding lands in Assessment 2 — see `ROADMAP.md`.

## 8. Assessment Deliverables

All Assessment 1 documents live in [`docs/assessment-1/`](docs/assessment-1/), one file per deliverable, so markers and teammates can find any artefact without searching.

## 9. License

MIT — see [`LICENSE`](LICENSE). Rationale in `docs/github-setup-guide.md#license-recommendation`.

## 10. Security

See [`SECURITY.md`](SECURITY.md) for how to report vulnerabilities and how HR policy data is handled.
