# Backend

FastAPI application: authentication, request routing, and orchestration between the frontend, the AI layer (`src/ai/`), and the database (`src/database/`).

| Folder | Purpose |
|---|---|
| `api/` | Route definitions / endpoints |
| `services/` | Business logic, calls into `src/ai/rag` for question answering |
| `models/` | Pydantic/ORM data models |
| `config/` | Environment and application configuration |

Scaffolding lands in Assessment 2 per `ROADMAP.md`.
