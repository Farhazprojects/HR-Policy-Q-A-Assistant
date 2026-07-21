# Security Policy

## Why This Matters

This system is designed to eventually handle real HR policy documents and, in a production deployment, potentially personal employee data (leave records, HR case references). Security is treated as a first-class requirement from Assessment 1 onward, not retrofitted later.

## Supported Versions

This is a capstone project without formal releases yet. Security practices apply to the `main` branch at all times.

## Reporting a Vulnerability

- Do **not** open a public GitHub Issue for a security concern.
- Contact the Technical Lead (Farhaz Khondoker) directly via the university-assigned communication channel.
- Include: affected component, reproduction steps, potential impact.

## Data Handling Principles (applies from design phase)

1. **No real employee data in the repository or test fixtures.** Only synthetic/sample HR policy documents are used for development and demonstration.
2. **Secrets never committed.** API keys and database credentials are loaded from environment variables (`.env`, excluded via `.gitignore`) and documented in `.env.example` only as placeholders.
3. **Least-privilege access** for any database or vector store credentials used in development.
4. **AI answers are traceable to source documents.** Every generated answer must cite the policy document/section it was grounded in — this is both a UX and an auditability requirement for HR use cases.
5. **Future SaaS phase:** authentication, role-based access control, and encryption-at-rest are tracked as roadmap items in `ROADMAP.md`, not assumed to exist yet.
