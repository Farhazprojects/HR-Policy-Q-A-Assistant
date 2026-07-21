# Project Scope

## In Scope (this trimester, Assessments 1–3)
- Business analysis, requirements, and project management deliverables for Assessment 1.
- A working RAG pipeline answering questions against a small set of synthetic sample HR policy documents.
- A functional chat interface (web) for submitting questions and viewing cited answers.
- A backend API connecting frontend, RAG pipeline, and database.
- Basic automated tests for core backend/AI logic.
- Repository, documentation, and GitHub configuration to a professional standard.

## Out of Scope (this trimester)
- Integration with real, organisation-specific HR systems or real employee data.
- Multi-tenant SaaS infrastructure (billing, tenant isolation, admin console).
- Support for multiple simultaneous LLM providers in production (the adapter interface is scaffolded; only one provider is actually wired up this trimester).
- Analytics dashboard implementation (folder is scaffolded; not built).
- Mobile application.
- Formal accessibility (WCAG) audit — noted as a non-functional requirement for future work, not verified this trimester.

## Boundary Notes
The repository intentionally contains folders for out-of-scope future capabilities (vector database upgrade path, analytics, multi-LLM support) so that scope for *this trimester* is clearly bounded, while the *system's* long-term architecture is not limited by decisions made under trimester time pressure. This distinction — project scope vs system architecture scope — is treated as deliberate and is reflected consistently across the WBS, Gantt chart, and repository structure.
