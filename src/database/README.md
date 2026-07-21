# Database

PostgreSQL schema for users, policy document metadata, and session/conversation history. Also hosts the `pgvector` extension used by `src/ai/vector-store/` for the MVP, so the system runs on a single database instance rather than two pieces of infrastructure during Assessments 1–2.

| Folder | Purpose |
|---|---|
| `migrations/` | Schema migration scripts |
| `seeds/` | Sample/synthetic data for development — never real employee data (see `SECURITY.md`) |
