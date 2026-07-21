# Business Analysis

## 1. Business Case
HR teams spend measurable time answering questions already covered by existing policy documentation. An AI assistant grounded in those documents can absorb a portion of that repetitive workload while giving employees faster, more consistent answers. For CQUniversity's assessment context, this also demonstrates a realistic enterprise AI use case — one with a clear compliance constraint (answers must be traceable to source policy, not invented) that makes it a legitimate, non-trivial systems project rather than "just a chatbot."

## 2. Stakeholder Analysis

| Stakeholder | Interest | Influence | Engagement Approach |
|---|---|---|---|
| Employees (end users) | Fast, accurate answers to policy questions | Low (no direct project authority) | User stories and UAT feedback loop |
| HR staff | Reduced repetitive query load; answers must be accurate and safe | Medium | Consulted on what "accurate" means for policy answers; sample documents sourced with their use case in mind |
| Unit Coordinator / Markers | Assessment criteria met; professional standard of work | High | Deliverables mapped directly to assessment criteria (see WBS) |
| Project team (Farhaz, Isuru, Dineli) | Successful delivery, individual skill development, portfolio value | High | Weekly stand-ups, shared Project board, defined role split |
| Future SaaS users (hypothetical, out of scope this trimester) | Product viability beyond the unit | Low (not active stakeholders yet) | Architecture kept extensible; not built for this trimester |

## 3. Current State (As-Is)
Employees currently search static documents (PDFs, intranet pages) or ask HR staff directly by email/in person. There is no single point of query, and no automated way to check whether an answer given verbally is consistent with the current written policy.

## 4. Future State (To-Be)
Employees ask a question through a chat interface; the system retrieves the relevant policy passage(s) and generates a grounded, cited answer. HR staff are freed from repetitive queries and can review flagged/unanswered questions to identify documentation gaps (Phase 4 analytics capability).

## 5. Gap Analysis

| Gap | Current State | Target State | Addressed By |
|---|---|---|---|
| No single query interface | Multiple disconnected sources | Single chat interface | `src/frontend` |
| No traceability of verbal HR answers | Answers not linked to source text | Every AI answer cites its source | RAG pipeline design (`src/ai/rag`) |
| No visibility into common/unanswered questions | Not tracked | Analytics dashboard (future phase) | `src/analytics` (Phase 4) |

## 6. Assumptions
- Sample/synthetic HR policy documents are representative enough of real policy structure for a valid assessment demonstration.
- The unit's assessment criteria do not require production-grade authentication/security, though the design anticipates it (see `SECURITY.md`).

## 7. Constraints
See Project Proposal, Section 9.
