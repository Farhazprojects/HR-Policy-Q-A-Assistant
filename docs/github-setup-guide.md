# GitHub Repository Setup Guide

This document covers everything that isn't a file in the repo, but is **configuration you set up in the GitHub UI** once the repository is created. Read this alongside the repository itself.

---

## 1. Repository Name

**Recommended:** `hr-policy-qa-assistant`

Lowercase, hyphenated, descriptive — matches GitHub naming conventions used by real engineering orgs (avoids camelCase or spaces, which break some tooling and URLs).

**Product/brand name (for the README title and future SaaS pitch):** *PolicyIQ* — can be introduced in the README subtitle without renaming the repo itself. Keeping the repo slug generic and the brand name cosmetic means you're not locked into the brand name if it changes later.

## 2. Repository Description (GitHub "About" field)

> AI-powered Enterprise Knowledge Management System that answers employee HR policy questions with grounded, cited responses. CQUniversity COIT20254 capstone project.

Kept under 160 characters (GitHub truncates longer descriptions in search results and org listings).

## 3. Repository Topics/Tags

```
ai, rag, retrieval-augmented-generation, hr-tech, enterprise-search,
knowledge-management, chatbot, fastapi, react, postgresql, vector-database,
capstone-project, cquniversity
```

**Why these specifically:** topics are how the repo becomes discoverable (in your portfolio, in GitHub search, to a future employer skimming your profile). Mixing domain tags (`hr-tech`, `enterprise-search`) with technical tags (`fastapi`, `vector-database`) signals both the business problem and the implementation to different audiences.

## 4. Labels

Beyond GitHub's defaults (`bug`, `documentation`, `enhancement`, `question`, `duplicate`, `wontfix`, `good first issue`), add:

| Label | Colour | Purpose |
|---|---|---|
| `assessment-1` | `#0E8A16` | Tied to the current graded deliverable |
| `assessment-2` | `#1D76DB` | |
| `assessment-3` | `#5319E7` | |
| `ai-rag` | `#FBCA04` | AI/retrieval pipeline work |
| `backend` | `#D93F0B` | |
| `frontend` | `#C2E0C6` | |
| `database` | `#BFD4F2` | |
| `business-analysis` | `#F9D0C4` | Isuru's domain |
| `documentation` *(exists)* | — | Dineli's domain, in addition to default |
| `blocked` | `#B60205` | Flag dependencies between members' work |
| `priority-high` / `priority-medium` / `priority-low` | red/yellow/green shades | Triage |

**Why label by both assessment and domain:** it lets the Project board be filtered two ways — "what's left for Assessment 1" (grading urgency) and "what's Isuru's vs Dineli's vs Farhaz's" (ownership) — without duplicating issues.

## 5. Milestones

| Milestone | Due | Scope |
|---|---|---|
| Assessment 1 — Foundation | End of Week 6 | Proposal, business analysis, scope, requirements, WBS, Gantt, risk register, quality plan, repo setup |
| Assessment 2 — Core Build | End of Week 10 | Backend skeleton, frontend chat UI, sample RAG pipeline, DB schema |
| Assessment 3 — Integration & Evaluation | End of Week 12 | End-to-end demo, evaluation harness, UAT, final report |

Milestones map 1:1 to the unit's assessment schedule, so progress toward a milestone *is* progress toward a grade — useful evidence if the team needs to show a marker or supervisor that work was tracked professionally.

## 6. GitHub Project Board

**Type:** Board view (Kanban), one board for the whole project.

**Columns:**
1. `Backlog` — captured but not yet scheduled
2. `To Do (this milestone)` — committed for the current assessment
3. `In Progress`
4. `In Review` — PR open, awaiting approval
5. `Done`

**Views to add beyond the board:**
- **Table view grouped by Assignee** — quick per-member workload check.
- **Table view grouped by Milestone** — assessment-readiness check before a deadline.

**Why one board, not one per member:** with three people, a single shared board keeps everyone aware of dependencies (e.g. Dineli's requirements need to land before Farhaz scaffolds the backend). Per-member boards would hide those dependencies.

## 7. GitHub Wiki Structure

Enable the Wiki for material that's reference-style rather than versioned-deliverable-style (the deliverables themselves stay in `docs/` so they're part of the reviewable, versioned repo history).

```
Home                          — project summary + links to key docs
Getting-Started               — local dev setup once code exists
Architecture-Decision-Records — one page per significant decision, with rationale
Glossary                      — domain terms (RAG, vector embedding, groundedness, etc.) for Isuru/Dineli
FAQ                           — recurring questions from teammates or markers
Meeting-Cadence               — when/how the team meets, recorded here so it's discoverable outside docs/
```

**Why Wiki *and* `docs/`, not one or the other:** `docs/` holds graded deliverables — they need version history, PR review, and to live alongside the code they describe. The Wiki holds living reference material that changes shape often (glossary entries, FAQs) and doesn't belong in the graded-artefact trail.

## 8. Discussion Categories

Enable GitHub Discussions with:

| Category | Format | Use |
|---|---|---|
| Announcements | Announcement | Deadlines, meeting changes (Farhaz/Isuru post) |
| Team Q&A | Q&A | "How do I..." questions from Isuru/Dineli to Farhaz |
| Design Decisions | Open-ended | Debate architecture/tooling choices before they become ADRs in the Wiki |
| Ideas / SaaS Extension | Open-ended | Post-semester feature ideas, kept separate so they don't clutter Assessment issues |

**Why Discussions instead of Issues for these:** Issues represent trackable, closeable units of work. Questions and open-ended design debate aren't "closed" the way a bug is fixed — forcing them into Issues either leaves stale open issues around or causes premature closing of an unresolved conversation.

## 9. License Recommendation

**MIT License.**

Rationale:
- Permissive — compatible with turning this into a commercial SaaS later without relicensing.
- Widely recognised, low legal overhead for a university project, and understood by markers and any future employer reviewing the portfolio.
- Alternative considered: **Apache 2.0** (adds explicit patent grant) — more relevant if patentable AI techniques were being developed here; not necessary at this stage, so MIT was chosen for simplicity. Revisit if the project pursues the "research extension" pathway.

## 10. Initial GitHub Issues — Assessment 1

Create these as Issues, each assigned to the relevant member, labelled `assessment-1` plus a domain label, and added to the Project board under Milestone "Assessment 1 — Foundation."

1. **[DOCS] Draft Project Proposal** — `documentation`, `business-analysis` — Isuru
2. **[DOCS] Conduct stakeholder analysis and document in Business Analysis section** — `business-analysis` — Isuru
3. **[DOCS] Define project Scope (in/out of scope statement)** — `business-analysis` — Isuru
4. **[DOCS] Write Functional Requirements** — `documentation` — Dineli
5. **[DOCS] Write Non-Functional Requirements** — `documentation` — Dineli
6. **[DOCS] Build Work Breakdown Structure (WBS)** — `business-analysis` — Isuru
7. **[DOCS] Build Gantt Chart from WBS** — `business-analysis` — Isuru
8. **[DOCS] Compile Risk Register** — `business-analysis` — Isuru
9. **[DOCS] Draft Quality Plan** — `business-analysis` — Isuru
10. **[DOCS] Document Team Roles and Resources** — `documentation` — Isuru + Dineli (joint)
11. **[DOCS] Draft initial UML use-case diagram** — `documentation` — Dineli
12. **[DOCS] Draft initial BPMN process diagram (employee asks HR question, current-state)** — `documentation` — Dineli
13. **[DOCS] Write initial User Stories** — `documentation` — Dineli
14. **[FEATURE] Scaffold GitHub repository structure (this task)** — `backend`, `assessment-1` — Farhaz
15. **[FEATURE] Draft high-level System Architecture diagram** — `ai-rag`, `backend` — Farhaz
16. **[FEATURE] Research and shortlist LLM provider(s) and vector store approach for MVP** — `ai-rag` — Farhaz
17. **[DOCS] Prepare Assessment 1 presentation slides and speaking script** — `documentation` — Dineli (content) + Isuru (delivery coordination)

## 11. Task Allocation

### Farhaz Khondoker — AI Lead / Solution Architect / Technical Lead
- Own the overall repository structure and GitHub configuration (this guide).
- Draft the system architecture and technology stack decisions.
- Research LLM provider and vector store options for the MVP.
- Own all folders under `src/` and `deployment/`.
- Review every PR touching code.
- Own `SECURITY.md` and data-handling design decisions.

### Isuru Koswaththa — Business Analyst
- Stakeholder analysis, project scope, business case.
- Work Breakdown Structure and Gantt chart.
- Risk register and quality plan.
- Coordinate UAT in Assessment 3 (test **planning ownership** stays with Dineli; Isuru coordinates who tests what and when).
- Own meeting minutes.

### Dineli Jayandee Gampolage — Systems Analyst / Documentation Lead
- Functional and non-functional requirements.
- UML and BPMN diagrams.
- User stories.
- Test cases (test plan authored here; execution coordinated by Isuru).
- User manual.
- Final report compilation and editing; presentation slide content.

**Why this split works for this team specifically:** Isuru and Dineli both have a Project Management minor and limited coding experience, so their allocations are entirely non-code deliverables where they can do strong, independent work without blocking on Farhaz. Farhaz's technical responsibilities don't overlap with graded PM deliverables, so no single deliverable depends on more than one person's specialist skill set, minimising the risk of one member blocking another mid-assessment.
