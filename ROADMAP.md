# Project Roadmap

## Phase 1 — Assessment 1 (Current Trimester, Weeks 1–6): Foundation
- Project proposal, business analysis, scope definition
- Functional and non-functional requirements
- WBS, Gantt chart, risk register, quality plan
- Repository scaffolding and GitHub project setup (this deliverable)

## Phase 2 — Assessment 2 (Weeks 7–10): Core Build
- Backend API skeleton (FastAPI) with health check and auth stub
- Frontend chat interface (React)
- Sample HR policy documents ingested
- Basic RAG pipeline: retrieval + single LLM provider, no evaluation yet
- Database schema for users, documents, conversation history

## Phase 3 — Assessment 3 (Weeks 11–12): Integration & Evaluation
- End-to-end demo: employee question → grounded answer with citation
- Basic AI evaluation harness (answer relevance, groundedness)
- UAT coordinated by Isuru; test cases executed against Dineli's test plan
- Final report and presentation

## Phase 4 — Beyond Semester (Research / Portfolio Extension)
- Multiple LLM provider support via the adapter layer
- Dedicated vector database (replacing pgvector MVP)
- Prompt management with versioning
- Knowledge base versioning (policy documents change over time — answers must reflect the current version)
- Analytics dashboard (most-asked questions, unanswered queries, policy gaps)
- Multi-tenant SaaS architecture (one deployment serving multiple organisations)

**Why this phasing:** Phase 1–3 map directly onto the unit's assessment schedule so grading criteria are met on time. Phase 4 is deliberately separated so the team is never blocked on "future-proofing" work during graded weeks, while the repository structure (folders created in Phase 1) means Phase 4 doesn't require restructuring — only implementation.
