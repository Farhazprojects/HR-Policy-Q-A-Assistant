# Feature traceability matrix

Every claim the approved Figma prototype makes, mapped to the implementation that
delivers it and the test that proves it.

## 1. Functional features

| Prototype feature | UI screen | Backend API | Database entity | Service | Test | Demonstration |
|---|---|---|---|---|---|---|
| Login with role-based access | `/login` | `POST /api/auth/login`, `GET /api/auth/me` | `User`, `AuditLog` | `authService` | `tests/integration/auth.test.ts` (8) | Sign in as each of the three accounts |
| Role-based access control | Sidebar filtering + all guarded pages | `requireAuth`, `requireRole` on every route | `User.role`, `AuditLog` | `middleware/auth` | `tests/integration/rbac.test.ts` (8) — **TEST 5** | Employee is refused HR upload |
| Employee dashboard | `/dashboard` | `GET /api/dashboard` | `Question`, `PolicyAcknowledgement`, `LeaveRequest` | `routes/dashboard` | `tests/integration/features.test.ts` | Live counts on the dashboard cards |
| Ask AI — grounded answer | `/ask` | `POST /api/chat` | `Question`, `Citation` | `ragService` | `tests/unit/rag.test.ts` — **TEST 1** | Ask the annual-leave question |
| Citations (document, page, section) | Citation cards in the Explainability panel | `POST /api/chat` | `Citation` → `PolicyChunk` | `ragService` | `tests/unit/rag.test.ts` | Expand a citation to reveal source text |
| Explainability panel | `/ask` right column | `POST /api/chat` | `Question` retrieval fields | `ragService` | `tests/unit/rag.test.ts` | Show similarity, threshold, Top-K, why-relevant |
| Retrieval-derived confidence | `ConfidenceIndicator` | `POST /api/chat` | `Question.confidence`, `.confidenceBand` | `rag/confidence` | `tests/unit/rag.test.ts` (4 confidence tests) | Show 89% HIGH and open "How is confidence calculated?" |
| Refusal / fallback path | Amber fallback card + reason | `POST /api/chat` | `Question.status = FALLBACK` | `ragService` | `tests/unit/rag.test.ts` — **TEST 2** | Ask the private-aircraft question |
| Policy search | `/search` | `GET /api/policies/search` | `PolicyDocument`, `PolicyChunk` | `policyService` | `tests/integration/features.test.ts` (4) | Search "annual leave" |
| Open policy document | Modal on `/search` | `GET /api/policies/:id` | `PolicyDocument`, `PolicyChunk` | `policyService` | `tests/integration/features.test.ts` | Open a policy and scroll its sections |
| Leave request workflow | `/leave` | `POST /api/leave`, `GET /api/leave` | `LeaveRequest` | `leaveService` | `tests/integration/features.test.ts` (6) | Submit a request and see it listed |
| Policy acknowledgements | `/acknowledgements` | `GET`/`POST /api/acknowledgements` | `PolicyAcknowledgement` | `acknowledgementService` | `tests/integration/features.test.ts` (5) | Acknowledge a pending policy |
| HR Officer dashboard | `/hr/dashboard` | `GET /api/hr/dashboard` | `PolicyDocument`, `Question`, `PolicyAcknowledgement` | `governanceService` | `tests/integration/features.test.ts` | Show the four live metric cards |
| Policy upload → indexed | `/hr/upload` | `POST /api/policies/upload` | `PolicyDocument`, `PolicyChunk` | `documentService` | `tests/unit/ingestion.test.ts` (11) — **TEST 3** | Upload the wellbeing policy live |
| Uploaded policy becomes retrievable | `/hr/upload` → `/ask` | `POST /api/policies/upload` → `POST /api/chat` | `PolicyChunk`, `Citation` | `documentService` + `ragService` | `tests/integration/features.test.ts` — **TEST 4** | Ask about the newly uploaded policy |
| Policy library | `/hr/library` | `GET /api/policies`, `DELETE /api/policies/:id` | `PolicyDocument` | `policyService` | `tests/integration/features.test.ts` | Show versions, chunk counts, status |
| AI governance dashboard | `/admin/governance` | `GET /api/admin/governance` | `Question`, `Citation`, `PolicyDocument`, `AuditLog` | `governanceService` | `tests/integration/features.test.ts` (4) | Show live metrics after asking questions |
| Audit activity | `/admin/governance` table | `GET /api/admin/activity` | `AuditLog` | `governanceService` | `tests/integration/features.test.ts` | Show the event trail |
| System overview | `/admin/system` | `GET /api/health` | — | `app.ts` health handler | Manual M1 | Walk the architecture and live provider status |
| Audit logging | Governance table | all routes | `AuditLog` | `auditService` | `auth`, `rbac`, `rag`, `features` | Show 13 event types |

## 2. Prototype-scope features (labelled, not overclaimed)

| Feature | Status | How it is labelled |
|---|---|---|
| Leave approval workflow | Requests are genuinely stored; no approval, entitlement balance or payroll integration | Amber "Academic prototype scope" panel on `/leave` and a badge in the review dialog |
| Policy Library management | Listing, versions, status and removal implemented; no version-diff or approval chain | Implemented functions only |

## 3. Roadmap placeholders

The prototype itself labels these as placeholders; they are shown in the
interface with a **PROTOTYPE** badge, are not clickable, and claim nothing.

| Feature | Prototype wording |
|---|---|
| Draft Generator | "Prototype placeholder for future AI-assisted drafting." |
| Analytics | "Prototype placeholder for usage and trend analysis." |
| Notifications | "Prototype placeholder for HR communications." |
| Policy Review Reminders | "Upcoming annual policy reviews and maintenance actions." |

## 4. Documented divergences from the prototype

| # | Prototype | Implementation | Reason |
|---|---|---|---|
| 1 | Sidebar shows every role's items on every screen | Navigation filtered by role; APIs return 403 | The prototype is a static click-through; RBAC is a stated proposal requirement. Recorded, not changed silently. |
| 2 | Fixed figures (24 policies, 1,284 questions, 91%, 0.87) | Live database queries; seeded rows labelled DEMO DATA | The brief forbids hard-coded metrics once real data exists |
| 3 | "Confidence 91%" beside "similarity 0.91" | Confidence computed from retrieval evidence by a documented formula | Confidence and similarity are different quantities; the model is never asked to score itself |
| 4 | Nav label "Acknowledgements", page title "Policy Acknowledgements" | Both preserved verbatim | Faithfulness to the prototype |

Full inspection record: [`IMPLEMENTATION_SPEC.md`](../requirements/prototype-implementation-spec.md).
