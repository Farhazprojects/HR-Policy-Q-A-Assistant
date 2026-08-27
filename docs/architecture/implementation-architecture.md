# Architecture

## 1. Overview

A three-tier application with a retrieval layer between the API and the data
store, and a governance layer that cross-cuts every tier.

```
┌──────────────────────────────────────────────────────────────┐
│ Employee · HR Officer · Administrator                        │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼──────────────────────────────────┐
│ Next.js Frontend (React 19, App Router, Tailwind)            │
│  • Dashboards, conversational UI, explainability panel       │
│  • Proxies /api to the Express API (same-origin cookie)      │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│ Express API (TypeScript)                                     │
│  routes → controllers → services                             │
│  middleware: auth · RBAC · validation · rate limit · errors  │
└──────────┬─────────────────────────────┬─────────────────────┘
           │                             │
┌──────────▼──────────────┐   ┌──────────▼─────────────────────┐
│ RAG Engine              │   │ Document Processing            │
│ • query embedding       │   │ • PDF text extraction          │
│ • vector retrieval      │   │ • page-aware chunking          │
│ • threshold filtering   │   │ • section detection            │
│ • context assembly      │   │ • embedding generation         │
│ • grounded generation   │   └──────────┬─────────────────────┘
│ • confidence + refusal  │              │
└──────────┬──────────────┘              │
           │        ┌────────────────────▼─────────┐
           │        │ AI Providers (abstracted)    │
           │        │ Gemini · Ollama · Local      │
           │        └──────────────────────────────┘
┌──────────▼───────────────────────────────────────────────────┐
│ PostgreSQL + Prisma                                          │
│ Users · PolicyDocuments · PolicyChunks (+embeddings)         │
│ Questions · Citations · LeaveRequests · Acknowledgements     │
│ AuditLogs                                                    │
└──────────────────────────────────────────────────────────────┘

Governance layer (cross-cutting): RBAC on every request, audit logging of every
significant event, retrieval-derived confidence on every answer.
```

## 2. Repository layout

The tree follows the capability-oriented structure agreed for this repository:
the knowledge layer (`src/ai/`) is deliberately separable from the API that
happens to expose it, so the same retrieval engine could later serve a search
portal or a Teams bot without re-architecting.

```
HR-Policy-Q-A-Assistant/
├── src/
│   ├── ai/                          the knowledge layer
│   │   ├── rag/                     tokenizer, PDF extraction, chunking
│   │   ├── vector-store/            embedding storage + similarity search
│   │   ├── llm-providers/
│   │   │   ├── llm/                 gemini · ollama · local (+ interface)
│   │   │   └── embedding/           gemini · ollama · local (+ interface)
│   │   ├── prompt-management/       grounding prompt, refusal wording
│   │   ├── evaluation/              retrieval-derived confidence
│   │   └── knowledge-base-versioning/  checksum + revision rules
│   ├── backend/                     the API that exposes the knowledge layer
│   │   ├── api/                     REST endpoints
│   │   ├── services/                business logic (rag, document, policy, …)
│   │   ├── middleware/              auth, RBAC, errors, rate limiting
│   │   ├── config/                  environment loading
│   │   ├── utils/                   errors, logger
│   │   └── storage/policies/        uploaded PDFs (git-ignored)
│   ├── database/
│   │   ├── schema.prisma            entities and relationships
│   │   ├── client.ts                Prisma client singleton
│   │   ├── migrations/              reserved for `prisma migrate`
│   │   └── seeds/                   policy content, PDF generator, seed script
│   └── frontend/
│       └── src/
│           ├── app/                 App Router pages
│           ├── components/ui/       design system
│           ├── components/layout/   sidebar, page header
│           ├── lib/                 api client, auth context, formatting
│           └── types/               shared response types
├── tests/
│   ├── unit/                        pipeline internals (ingestion, RAG, confidence)
│   ├── integration/                 API surface (auth, RBAC, features)
│   └── support/                     shared fixtures and bootstrap
├── scripts/demo/                    retrieval diagnostic
└── docs/
```

### Module boundaries

`src/ai` is addressed through the `@ai/*` path alias, `src/backend` through
`@backend/*`, and `src/database` through `@db/*`. Aliases rather than deep
relative paths mean a file can move within a capability without editing its
consumers, and an import line states which layer it crosses:

```ts
import { vectorStore } from '@ai/vector-store/vectorStore';
import { prisma } from '@db/client';
```

Aliases are declared once in `tsconfig.json`, mirrored in `vitest.config.ts` for
tests, and rewritten to real relative paths at build time by `tsc-alias`, so the
emitted `dist/` runs under plain Node with no runtime resolver.

## 3. Key design decisions

### Provider abstraction over direct SDK calls

`EmbeddingProvider` and `LLMProvider` are interfaces; the pipeline never
references a vendor. Consequences: the system runs with no API key, provider
choice is an environment variable, embedding and generation providers are chosen
independently, and each provider declares its own similarity function and health
check. This is what satisfies the requirement that no paid subscription be
mandatory.

### VectorStore abstraction instead of compromising on pgvector

`pgvector` was unavailable on the development server. The alternative to an
abstraction would have been to weaken the architecture. Instead, embeddings live
in a `float8[]` column and similarity is computed in the service layer behind a
`VectorStore` interface, so a pgvector implementation is a drop-in replacement.

### Refusal decided before generation

The threshold check happens in `ragService` *before* any provider call. A refusal
is therefore a property of the system, not of the model's willingness to comply —
it holds identically whether the provider is Gemini, Ollama or the local
extractive composer.

### Confidence computed by the application

Asking a model to score its own confidence produces a number with no defined
meaning. Deriving it from similarity evidence gives a figure that is reproducible,
explainable, and comparable across providers.

### Same-origin API proxy

`next.config.mjs` rewrites `/api/*` to the Express server. The browser therefore
makes same-origin requests, the session JWT lives in an `httpOnly` cookie that
JavaScript cannot read, and no CORS exception or token-in-localStorage is needed.

### Seed data produced by the real pipeline

`npm run seed` renders fictional policies to PDF, then ingests them through the
same `ingestPolicyPdf` path an HR upload uses. The demonstration corpus is
genuinely a product of the system rather than rows inserted into a table.

## 4. Request lifecycle — `POST /api/chat`

1. `generalLimiter` → `aiLimiter` rate limiting.
2. `requireAuth` verifies the JWT (cookie or bearer) and loads the user.
3. Zod validates the question.
4. `ragService.ask` writes an `AI_QUERY` audit event.
5. Query embedded; `vectorStore.search` returns the top `TOP_K` hits.
6. Threshold filter. If empty → refusal, no provider call, `AI_FALLBACK` audit.
7. Otherwise context assembled and the provider generates.
8. Confidence computed from retrieval evidence.
9. `Question` + `Citation` rows persisted; `AI_GROUNDED_RESPONSE` audit written.
10. Response returns answer, citations, explainability and provider metadata.

Any thrown `AppError` becomes a status-coded JSON error; anything else becomes a
generic 500. Stack traces never reach the client.

## 5. Frontend structure

- `app/login` — unauthenticated.
- `app/(app)/*` — route group behind an auth guard rendering the sidebar shell.
- Navigation is filtered by role, so an employee never sees HR or Administration
  items. The API enforces the same boundary independently: hiding a link is not
  treated as access control.
- `AuthProvider` holds session state; `ToastProvider` provides notifications.
- All data fetching goes through `lib/api.ts`, which normalises errors into
  `ApiRequestError` with a user-safe message.

## 6. Security summary

| Control | Implementation |
|---|---|
| Password storage | bcrypt, cost 10 |
| Session | JWT (8 h) in an `httpOnly`, `sameSite=lax` cookie |
| Account enumeration | Identical message and a dummy bcrypt compare for unknown users |
| Authorisation | `requireRole` middleware; denials audited |
| Input validation | Zod on every request body |
| File validation | MIME + extension + `%PDF-` magic number + size limit |
| Rate limiting | General 300/min, AI 20/min, auth 20/15 min, upload 10/min |
| Headers | Helmet |
| Secrets | Server-side only; never sent to the browser |
| Error handling | `AppError` for user-safe messages; generic 500 otherwise |
| Audit | 13 event types with actor, timestamp and non-sensitive metadata |
