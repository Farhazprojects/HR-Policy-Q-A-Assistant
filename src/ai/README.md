# AI Layer

This is the core intelligence layer of the system — everything that turns a policy document collection plus a question into a grounded, cited answer.

| Folder | Purpose | Status |
|---|---|---|
| `rag/` | The retrieval-augmented generation pipeline: document chunking/ingestion, retrieval orchestration, answer generation | Assessment 2 MVP |
| `vector-store/` | Embedding storage and similarity search, built against an abstract interface so the backing store can change | Assessment 2 MVP (pgvector) |
| `llm-providers/` | Adapter layer so the system isn't locked to one LLM vendor | Assessment 2 MVP (single provider wired), extensible |
| `prompt-management/` | Versioned prompt templates used by the RAG pipeline, kept out of code so they can change without a redeploy | Scaffolded, future phase |
| `evaluation/` | Scores generated answers for groundedness and relevance against retrieved context | Assessment 3 |
| `knowledge-base-versioning/` | Tracks changes to policy documents over time so answers can reference the currently active version | Scaffolded, future phase |

**Why this folder exists separately from `backend/`:** the AI layer has a different rate of change and a different testing approach (evaluation against sample Q&A pairs, not just unit tests) than typical API/business logic. Separating it keeps `backend/` focused on request handling and lets the AI layer be developed, tested, and swapped independently — directly supporting the "multiple LLM providers" and "AI evaluation" requirements from the assessment brief.
