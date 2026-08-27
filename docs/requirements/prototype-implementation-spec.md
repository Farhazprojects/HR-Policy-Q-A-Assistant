# Implementation Specification (Phase 1)

Derived by direct inspection of the approved Figma prototype
`VqJE6hNKSPQfD7JC2qJC8f`, page `HR Policy Assistant – Prototype`, via the Figma
MCP API on 18 August 2026. This document is the traceable bridge between the
prototype and the implementation.

## 1. Frames found in the prototype

| # | Figma node | Frame name |
|---|------------|------------|
| 1 | `3320:571` | 01 – Login |
| 2 | `3320:588` | 02 – Employee Dashboard |
| 3 | `3320:635` | 03 – Ask AI |
| 4 | `3320:685` | 04 – Policy Search |
| 5 | `3320:732` | 05 – Leave Request |
| 6 | `3320:780` | 06 – Policy Acknowledgements |
| 7 | `3320:824` | 07 – HR Officer Dashboard |
| 8 | `3320:891` | 08 – Upload Policy |
| 9 | `3320:930` | 09 – AI Governance Dashboard |
| 10 | `3320:989` | 10 – System Overview |
| 11 | `3337:55` | HR Policy Knowledge Management System Architecture |

All frames are 1440×900 desktop.

## 2. Navigation (verbatim from prototype)

The sidebar is identical on every authenticated frame and is grouped into three
labelled sections:

- **(ungrouped)** — Dashboard, Ask AI, Policy Search, Leave Request, Acknowledgements
- **HR Officer** — HR Dashboard, Upload Policy, Policy Library
- **Administration** — AI Governance, Admin

Brand block: "HR Policy" / "Knowledge Assistant".
Footer identity block: user name, then "<Role> • Active".

The prototype renders all groups regardless of role. The implementation applies
role-based access control: items outside a user's role are hidden, and the
corresponding APIs return `403`. This is an intentional, documented divergence —
the prototype is a static flow, whereas RBAC is a stated proposal requirement.

## 3. Design tokens (sampled from the Figma render)

| Token | Value |
|-------|-------|
| Sidebar background | `#141A29` |
| Sidebar nav item (inactive) | `#1F2436` |
| Sidebar nav item (active) | `#5440CC` |
| Application background | `#F5F7FA` |
| Surface / card | `#FFFFFF` |
| Primary heading text | `#1A1F2E` |
| Accent — primary | `#5440CC` |
| Accent — positive | `#1F8C59` |
| Sidebar width | 242 px |
| Card radius | 12 px |

## 4. Screen-by-screen requirements

### 01 – Login
Left: brand "HR Policy Knowledge Assistant" + "AI-powered, policy-grounded
employee self-service". Right: 500×600 card — "Welcome back", "Sign in to access
your HR knowledge workspace.", Email, Password, "Sign in", and the notes
"Prototype accounts: Employee • HR Officer • Admin" / "Role-based access is
demonstrated in this prototype."

### 02 – Employee Dashboard
Title "Employee Dashboard" / "Your central hub for HR self-service and policy
information." Three action cards: Ask the HR AI, Search Policies, Leave Request.
"Recent activity" section: an activity card and an acknowledgements card
("2 policies awaiting acknowledgement" — live count in implementation).

### 03 – Ask AI  (primary function)
Two columns. Left: conversation card with Employee / HR Policy Assistant turns,
composer "Type your HR question…" + "Send", and the grounding note
"Source-grounded response • No unsupported policy information used".
Right: "Explainability" panel — "Why this answer?", "Retrieved policy sources",
source cards showing `<Title>` / `Page N • <Section> • similarity 0.XX`,
"Confidence" as a large percentage, "Retrieval-based confidence indicator", and
"If no relevant policy is found, the assistant refuses to invent an answer."

### 04 – Policy Search
Search field + "Search" button; "Search results" list of policy cards showing
title, relevant sections, updated year; "Policy summary" and "Open document".

### 05 – Leave Request
"Guided self-service workflow for initiating a leave request." Fields: Leave
type, Start date, End date, Reason; "Review request" action. The prototype
states: "The full capstone will connect this workflow to appropriate business
rules and approval processes." — implemented as a real persisted request with a
clearly labelled prototype-scope notice; no payroll/HRIS integration is claimed.

### 06 – Policy Acknowledgements
"Awaiting your acknowledgement" list with `Assigned <date> • Version <x.y>` and
an "Acknowledge" action per policy; "Completed" count.

### 07 – HR Officer Dashboard
Four metrics: Policies, Questions, Acknowledgements (% completion), AI Accuracy
(retrieval confidence). "HR tools": Upload Policy, Policy Library, Draft
Generator, Policy Review Reminders, Analytics, Notifications.
The prototype explicitly labels Draft Generator, Analytics and Notifications as
"Prototype placeholder…" — these remain labelled roadmap features.

### 08 – Upload Policy
Drag-and-drop PDF zone + "Choose PDF". "Processing pipeline: PDF extraction →
Chunking → Embeddings → Knowledge base". Governance note: "Only approved
organisational HR policy documents should be added to the knowledge base."
Must be genuinely functional: the uploaded PDF becomes retrievable by Ask AI.

### 09 – AI Governance Dashboard
Metrics: Policies indexed, AI questions, Grounded answers, Fallbacks.
Monitoring panels: Retrieval quality ("Average top-result similarity … •
Threshold …"), Access control, Audit activity, Responsible AI.
All values are computed from the database, not hard-coded.

### 10 – System Overview
Employee/HR → Next.js Frontend → Express API → RAG Engine → HR Policy Knowledge
Base, with a Governance Layer. Mirrors frame `3337:55`.

## 5. Prototype claims classified

**Functional (must genuinely work):** authentication, RBAC, Ask AI RAG with
citations + explainability + retrieval confidence, refusal/fallback, policy
search, PDF upload → extract → chunk → embed → index → retrievable, leave
request persistence, policy acknowledgement persistence, HR metrics, governance
metrics, audit logging.

**Prototype scope (labelled, not overclaimed):** leave approval workflow and
business rules; Policy Library is functional for listing/versions only.

**Roadmap placeholders (labelled in UI, as the prototype itself labels them):**
Draft Generator, Analytics, Notifications, Policy Review Reminders.

## 6. Contradictions between prototype and build brief

1. **Sidebar shows every role's items.** Prototype is a static click-through;
   the brief requires RBAC. Resolution: RBAC enforced, nav filtered by role.
   Recorded here rather than changed silently.
2. **Prototype shows fixed figures** (24 policies, 1,284 questions, 91%, 0.87).
   The brief forbids hard-coding once real data exists. Resolution: all figures
   are live database queries; seeded rows are labelled DEMO DATA in the UI.
3. **Prototype "Confidence 91%"** sits beside "similarity 0.91". Resolution:
   confidence is computed from retrieval evidence by the application (never
   requested from the LLM); the formula is documented in `architecture/rag-pipeline.md`.
4. **Nav label** is "Acknowledgements" in the sidebar but the page title is
   "Policy Acknowledgements". Both are preserved as-is.

No contradiction is blocking; implementation proceeds.

## 7. Environment findings (this machine)

- PostgreSQL 16.14 (Homebrew) — started for the project; database `hr_policy_assistant`.
- **`pgvector` is not available** on this server. The brief permits a clean
  `VectorStore` abstraction in that case: embeddings are stored in PostgreSQL and
  cosine similarity is computed in the service layer behind the same interface a
  pgvector store would implement. Swapping in pgvector requires only a new class.
- No Ollama, no Docker, no Gemini API key present. Therefore the default
  configuration must demonstrate the full pipeline with no external API, which
  the brief requires (§21). Provider abstractions allow Gemini or Ollama to be
  enabled by environment variable alone.
