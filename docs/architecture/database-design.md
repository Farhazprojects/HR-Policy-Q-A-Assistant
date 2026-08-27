# Database design

PostgreSQL 16 via Prisma 6. Schema: `src/database/schema.prisma`.

## 1. Entity relationships

```
User ──┬──< Question ──< Citation >── PolicyChunk >── PolicyDocument
       │                     │                            │
       │                     └────────────────────────────┘
       ├──< LeaveRequest
       ├──< PolicyAcknowledgement >── PolicyDocument
       ├──< AuditLog
       └──< PolicyDocument (uploadedBy)
```

## 2. Entities

### User
Accounts and roles. `password` stores a bcrypt hash and is never returned by any
API. `isDemo` marks seeded demonstration accounts.

| Column | Type | Notes |
|---|---|---|
| id | cuid | PK |
| email | string | unique |
| name | string | |
| password | string | bcrypt hash |
| role | Role | `EMPLOYEE` \| `HR_OFFICER` \| `ADMIN`, indexed |
| jobTitle, department | string? | |
| isActive | boolean | inactive accounts cannot sign in |
| isDemo | boolean | seeded account |
| createdAt, updatedAt | timestamp | |

### PolicyDocument
An uploaded HR policy PDF and its processing state.

| Column | Type | Notes |
|---|---|---|
| id | cuid | PK |
| title, category, version | string | unique on `(title, version)` |
| summary | string? | shown in search results |
| filePath | string | server-side only, never exposed by the API |
| originalName, mimeType, fileSize | | |
| pageCount, chunkCount | int | reported after indexing |
| checksum | string? | SHA-256; prevents re-embedding an unchanged file |
| status | DocumentStatus | `UPLOADED → EXTRACTING → CHUNKING → EMBEDDING → INDEXED` \| `FAILED`, indexed |
| statusMessage | string? | failure reason |
| embeddingModel | string? | which model produced the vectors |
| requiresAcknowledgement | boolean | drives acknowledgement assignment |
| isDemo | boolean | seeded policy — labelled DEMO DATA in the UI |
| effectiveDate | timestamp? | |
| uploadedById | FK → User | `SetNull` on delete |

### PolicyChunk
A retrievable passage with its embedding. Cascade-deleted with its document.

| Column | Type | Notes |
|---|---|---|
| id | cuid | PK |
| documentId | FK → PolicyDocument | cascade, indexed |
| chunkIndex | int | unique on `(documentId, chunkIndex)` |
| page | int | real page number, indexed |
| section | string | detected heading |
| content | string | chunk text |
| tokenCount | int | estimate, for reporting |
| embedding | Float[] | `float8[]`; see the VectorStore note below |
| embeddingModel | string? | |

### Question
One AI interaction with the retrieval evidence behind it. Storing the evidence is
what makes any past answer auditable.

| Column | Type | Notes |
|---|---|---|
| id | cuid | PK |
| userId | FK → User | cascade, indexed |
| question, answer | string | |
| status | AnswerStatus | `GROUNDED` \| `FALLBACK` \| `ERROR`, indexed |
| topSimilarity, meanSimilarity | float | retrieval evidence |
| confidence | float | 0–1, computed by the application |
| confidenceBand | string | `HIGH` \| `MEDIUM` \| `LOW` |
| retrievedCount | int | chunks accepted |
| threshold, topK | float/int | configuration in force at the time |
| llmProvider, llmModel | string? | `not-invoked` on the refusal path |
| embeddingProvider | string? | |
| generationMode | string? | `generative` \| `extractive` |
| latencyMs | int | |
| fallbackReason | string? | |
| createdAt | timestamp | indexed |

### Citation
Evidence supporting one answer. Denormalised title/page/section so a citation
remains meaningful even if the source document is later removed.

| Column | Type | Notes |
|---|---|---|
| questionId | FK → Question | cascade, indexed |
| chunkId | FK → PolicyChunk? | `SetNull` |
| documentId | FK → PolicyDocument? | `SetNull`, indexed |
| documentTitle, page, section | | denormalised |
| excerpt | string | supporting text, ≤600 chars |
| similarity | float | |
| rank | int | 1 = strongest |

### LeaveRequest
`isPrototypeWorkflow` defaults true and records that no payroll or HRIS
integration occurs.

| Column | Type | Notes |
|---|---|---|
| userId | FK → User | cascade, indexed |
| leaveType | LeaveType | `ANNUAL` \| `PERSONAL` \| `CARERS` \| `UNPAID` \| `LONG_SERVICE` |
| startDate, endDate | timestamp | |
| totalDays | int | inclusive calendar days |
| reason | string | |
| status | LeaveStatus | `SUBMITTED` \| `UNDER_REVIEW` \| `APPROVED` \| `DECLINED` \| `CANCELLED`, indexed |

### PolicyAcknowledgement
Unique on `(userId, documentId, policyVersion)`, so a new policy version requires
a fresh acknowledgement. `acknowledgedAt` is null while pending.

### AuditLog
| Column | Type | Notes |
|---|---|---|
| userId | FK → User? | `SetNull`, indexed |
| event | AuditEvent | 13 values, indexed |
| entity, entityId | string? | |
| metadata | Json? | non-sensitive context only |
| ipAddress | string? | |
| createdAt | timestamp | indexed |

## 3. Indexes

Beyond primary keys: `User.role`; `PolicyDocument.status`, `.category`, unique
`(title, version)`; `PolicyChunk.documentId`, `.page`, unique
`(documentId, chunkIndex)`; `Question.userId`, `.status`, `.createdAt`;
`Citation.questionId`, `.documentId`; `LeaveRequest.userId`, `.status`;
`PolicyAcknowledgement.userId`, `.documentId`; `AuditLog.event`, `.userId`,
`.createdAt`.

## 4. Vector storage

Embeddings are stored as `Float[]` (`float8[]`) rather than a `pgvector` column,
because the extension was unavailable on the development server. All access goes
through the `VectorStore` interface (`src/ai/vector-store/vectorStore.ts`), so
migrating to pgvector means adding one class and an index — no schema change is
needed elsewhere and no calling code changes. See `architecture/rag-pipeline.md` §5.

## 5. Data minimisation

The schema stores no salary, home address, date of birth, emergency contact,
health information or government identifier. Leave reasons are free text supplied
by the employee and capped at 500 characters. Audit metadata holds counts,
scores and identifiers — never question text or policy content.

## 6. Commands

```bash
npm run db:generate
```

```bash
npm run db:push
```

```bash
npm run db:studio
```

```bash
npm run db:reset
```
