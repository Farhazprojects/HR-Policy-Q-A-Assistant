# Risk Register

| ID | Risk | Likelihood | Impact | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R-01 | Two of three team members have limited coding experience, creating a single point of failure on technical delivery | High | High | Critical | Technical work scoped and sequenced so Farhaz is never blocked waiting on code from others; Isuru/Dineli own fully independent non-code deliverables | Farhaz |
| R-02 | Scope creep from "SaaS-ready" ambitions delays Assessment 1–3 core deliverables | Medium | High | High | Explicit Scope document separates "this trimester" from "future phase"; future-phase folders are scaffolded but not built | Isuru |
| R-03 | LLM/vector store costs or rate limits block development close to a deadline | Medium | Medium | Medium | Use free-tier/local options (e.g. pgvector, low-cost LLM API tier) for development; document provider swap path | Farhaz |
| R-04 | AI answers hallucinate or misstate policy, undermining the system's core value proposition | Medium | High | High | Retrieval-grounded design with mandatory citation (FR-04); flag low-confidence retrieval instead of guessing (FR-05) | Farhaz |
| R-05 | Team member unavailability (illness, work commitments) delays a milestone | Medium | Medium | Medium | Weekly stand-ups surface blockers early; tasks broken into WBS items small enough to redistribute | Isuru |
| R-06 | Real or sensitive HR data is accidentally used or committed | Low | High | Medium | Synthetic sample documents only; `.gitignore` and `SECURITY.md` enforce no-secrets and no-real-data policy | Farhaz |
| R-07 | Inconsistent documentation quality/referencing style across three authors | Medium | Low | Low | CQU Harvard referencing enforced via PR review checklist in CONTRIBUTING.md | Dineli |
| R-08 | Merge conflicts or lost work from parallel editing without branching discipline | Low | Medium | Low | Branching strategy and PR review process defined in CONTRIBUTING.md before implementation begins | Farhaz |

**Scoring:** Score = Likelihood × Impact, expressed qualitatively (Low/Medium/High/Critical) rather than numerically, since a 3-person capstone team benefits more from a shared quick read than from a precision-weighted risk matrix that takes longer to maintain than it saves.
