# Project Proposal — HR Policy Q&A Assistant

## 1. Project Title
HR Policy Q&A Assistant: An AI-Powered Enterprise Knowledge Management System

## 2. Background and Problem Statement
Employees regularly need answers to HR policy questions — leave entitlements, workplace conduct, onboarding steps, benefits — that already exist in handbooks and policy documents but are difficult to search manually. This creates repeated, low-value workload for HR staff and inconsistent answers across employees. Existing solutions (searchable PDFs, static FAQ pages) require the employee to already know roughly where to look; they do not answer a question directly.

## 3. Proposed Solution
An AI assistant that accepts natural-language HR questions and returns answers grounded in the organisation's actual policy documents, with a citation back to the source section. The assistant is one interface into a broader Enterprise Knowledge Management System, so the underlying retrieval and knowledge layer can later support other interfaces (search portal, internal API, Teams/Slack bot) without re-architecture.

## 4. Objectives
1. Reduce time-to-answer for common HR policy questions.
2. Reduce repetitive query load on HR staff for questions already documented.
3. Keep every AI answer traceable to a source policy document (auditability).
4. Build the system on an architecture that could scale to a multi-tenant SaaS product beyond the unit.

## 5. Target Users
- **Employees** — primary users asking policy questions.
- **HR staff** — indirect beneficiaries (reduced repetitive queries); also responsible for keeping the underlying policy documents current.
- **System administrators** (future phase) — manage document ingestion and monitor unanswered/failed queries.

## 6. High-Level Approach
Retrieval-Augmented Generation (RAG): policy documents are chunked and embedded into a vector store; a user question is embedded and matched against the store; the most relevant chunks are passed to a large language model along with the question, which generates a grounded answer with a citation. Full detail: `docs/architecture/system-architecture.md`.

## 7. Deliverables (this trimester)
See `ROADMAP.md` in the repository root for the full phased plan across Assessments 1–3.

## 8. Success Criteria
- Assistant correctly answers a defined set of sample HR questions with accurate citations during Assessment 3 demonstration.
- All Assessment 1–3 deliverables submitted on schedule per the Gantt chart.
- Repository and documentation meet a standard suitable for a professional portfolio.

## 9. Constraints
- Single trimester timeline.
- Two of three team members have limited coding background — technical implementation load falls primarily on one member; project plan (WBS, Gantt) reflects this explicitly.
- No real employee or HR data is available or permitted — development uses synthetic sample policy documents only (see `SECURITY.md`).
