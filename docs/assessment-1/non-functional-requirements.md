# Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Accuracy / Groundedness | Generated answers must be derived only from retrieved policy content; the system must not present unsupported claims as policy fact. |
| NFR-02 | Performance | A typical query should return an answer within a few seconds under development/demo load. |
| NFR-03 | Usability | The chat interface must be usable without training or a manual for a first-time employee user. |
| NFR-04 | Auditability | Every answer must retain a traceable link to its source document and section for compliance review. |
| NFR-05 | Security | No real employee or HR case data is used in development; secrets/credentials are never committed to the repository (see `SECURITY.md`). |
| NFR-06 | Maintainability | The codebase is organised by capability (`ai/`, `backend/`, `frontend/`) so a new contributor can locate relevant code without reading the entire system. |
| NFR-07 | Extensibility | The LLM provider and vector store are accessed through an adapter/interface layer so either can be replaced without rewriting the retrieval or API logic. |
| NFR-08 | Portability | The system is containerised (Docker) so it can run consistently in development, CI, and any future deployment target. |
| NFR-09 | Accessibility | (Target for future work) Interface should meet WCAG 2.1 AA where practical; not formally audited this trimester. |

Non-functional requirements are grouped by category rather than listed flat, so that quality attributes (security, maintainability) are visibly distinct from functional accuracy attributes when reviewed against the Quality Plan.
