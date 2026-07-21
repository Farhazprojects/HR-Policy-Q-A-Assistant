# Quality Plan

## 1. Quality Objectives
- Every graded deliverable is reviewed by at least one team member other than its author before submission.
- All AI-generated answers in the working system are traceable to a cited source document (see NFR-04).
- Documentation follows CQU Harvard referencing consistently across all three authors.
- The repository itself — structure, README, templates — is held to the same "would this pass a professional code review" standard as the code.

## 2. Quality Assurance Activities

| Activity | Applies To | Frequency | Owner |
|---|---|---|---|
| Peer review via Pull Request | All code and documentation changes | Every PR | Whole team (CONTRIBUTING.md process) |
| Weekly stand-up review of Project board | Overall progress | Weekly | Whole team |
| Referencing check | Documentation citing external sources | Before each submission | Dineli |
| Manual test pass against defined sample questions | RAG pipeline | Before each milestone demo | Isuru (UAT coordination) |
| Architecture/decision review | Significant technical choices | Ad hoc, logged as ADRs in Wiki | Farhaz |

## 3. Quality Standards Referenced
- CQU Harvard referencing style for all citations.
- Conventional Commits for commit history (see CONTRIBUTING.md).
- MoSCoW prioritisation for requirements (see functional-requirements.md).

## 4. Roles in Quality Management
- **Isuru** — coordinates UAT and verifies deliverables against the risk register and quality plan before submission.
- **Dineli** — verifies documentation consistency, referencing, and completeness of test cases.
- **Farhaz** — verifies code quality, review coverage, and that AI-generated answers meet groundedness/citation requirements.

## 5. Continuous Improvement
Weekly meeting minutes include a short retrospective note (`docs/meeting-minutes/`) — what worked, what to change — so quality practices are adjusted across the trimester rather than fixed once at the start.
