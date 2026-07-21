# Contributing Guide

This document defines how the team works in this repository. It exists so that all three members — regardless of coding background — follow the same predictable process.

## Branching Strategy: GitHub Flow (simplified trunk-based)

We use **GitHub Flow** rather than full GitFlow. Rationale: GitFlow's `develop`/`release`/`hotfix` branches are designed for teams shipping versioned releases on a schedule; a 3-person capstone team with weekly deliverables gets more value from a simpler model with less merge overhead.

```
main                    ← always deployable / always markable
 └── feature/xxx         ← one branch per issue
 └── docs/xxx             ← one branch per documentation deliverable
 └── fix/xxx               ← bug fixes
```

Rules:
- `main` is protected — no direct pushes. All changes arrive via Pull Request.
- Branch names are prefixed by type: `feature/`, `fix/`, `docs/`, `chore/`.
- Example: `feature/rag-pipeline-skeleton`, `docs/risk-register`.
- Delete branches after merge to keep the branch list readable.

## Commit Message Convention: Conventional Commits

```
<type>(<scope>): <short summary>

[optional body]
[optional footer, e.g. Closes #12]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

**Examples:**
```
docs(assessment-1): add risk register with 8 identified risks
feat(backend): scaffold FastAPI app with health check endpoint
fix(frontend): correct chat input focus loss on submit
```

**Why Conventional Commits:** it gives us a machine-readable history (useful for generating a changelog later if this becomes a SaaS product) and makes the non-technical team members' documentation commits just as structured and reviewable as code commits.

## Pull Request Process

1. Create a branch from `main` following the naming convention above.
2. Commit work following the message convention.
3. Open a PR using the template in `.github/PULL_REQUEST_TEMPLATE.md`.
4. At least **one other team member reviews and approves** before merge — including documentation-only PRs, so all three members stay aware of what's in the repo.
5. Squash-merge into `main`; delete the branch.

## Code Review Standards (for code PRs)

- Does it match the folder/module it's placed in (see README repository structure)?
- Are secrets/API keys absent from the diff?
- Is there at least a minimal test for new backend/AI logic?
- Does it update relevant documentation if behaviour changed?

## Documentation Review Standards (for docs PRs)

- Correct CQU Harvard referencing where sources are cited.
- Placed in the correct `docs/` subfolder (see README).
- Spelling/grammar pass before requesting review.

## Development Workflow (weekly cycle)

1. **Monday** — Stand-up: review open issues on the Project board, confirm this week's targets.
2. **Throughout week** — Work happens on feature/docs branches, PRs opened as work completes.
3. **Before Friday** — All PRs for the week merged; Project board columns updated.
4. **Friday** — Meeting minutes logged in `docs/meeting-minutes/`.

## Task Allocation

See [`docs/github-setup-guide.md`](docs/github-setup-guide.md#task-allocation) for the full breakdown by team member.
