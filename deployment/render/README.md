# Deploying to Render + Neon

A permanent HTTPS link your team and unit coordinator can open at any time.
Free. Every push to `main` redeploys automatically.

**What you need:** a GitHub account (you already have it), about 25 minutes, and
your Gemini and Ollama API keys.

---

## How it runs

```
Browser ──HTTPS──▶ Render web service (free, Singapore)
                     one Node process
                     ├── /api/*   Express API
                     └── /*       Next.js interface
                          │
                          ▼
                   Neon PostgreSQL (free, Sydney)
```

One service serves both the API and the interface, so there is one URL and the
login cookie stays same-origin.

**Why Singapore and Sydney.** Render offers no Australian region; Singapore is the
nearest. The database is in Sydney. Each query between them adds roughly 90 ms,
which amounts to about half a second on a question — small beside the several
seconds a language model takes to answer. Visitors connect only to Render, so
where the database sits does not change how quickly pages reach them. Uploaded PDFs are not needed after they are
indexed — everything retrieval uses lives in the database — so Render's
temporary disk is not a problem.

---

## Step 1 — Create the database on Neon (5 minutes)

1. Go to **https://neon.tech** and sign up. *Continue with GitHub* is quickest.
2. **Create project**
   - Name: `hr-policy-qa`
   - Region: **AWS Asia Pacific (Sydney)**
3. On the project dashboard click **Connect**.
4. **Turn "Connection pooling" OFF.** The schema step needs a direct connection.
5. Copy the connection string. It looks like:
   `postgresql://neondb_owner:••••••@ep-xxxx.ap-southeast-2.aws.neon.tech/neondb?sslmode=require`

Keep it somewhere private for step 2. It contains a password.

---

## Step 2 — Deploy on Render (10 minutes + build time)

1. Go to **https://render.com** and sign up with **GitHub**.
2. Authorise Render to see the `HR-Policy-Q-A-Assistant` repository.
3. **New → Blueprint** → choose `Farhazprojects/HR-Policy-Q-A-Assistant`.
   Render reads `render.yaml` and shows one web service.
4. Fill in the four secrets:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Neon string from step 1 |
   | `SEED_PASSWORD` | a **new** password for the demo accounts — not `Capstone#2026`, which is public in this README |
   | `GEMINI_API_KEY` | a **freshly created** Gemini key (rotate the one used during development) |
   | `OLLAMA_API_KEY` | your Ollama Cloud key |

5. **Apply.** The first build takes about 5–8 minutes. It installs, builds,
   creates the tables, and seeds six policies through the real ingestion
   pipeline.
6. When it shows **Live**, open the URL at the top — something like
   `https://hr-policy-qa-assistant.onrender.com`.

---

## Step 3 — Check it

- `https://<your-url>/api/healthz` → `{"status":"ok"}`
- Sign in as `employee@company.com` with your `SEED_PASSWORD`.
- Ask *"can I work from home?"* in each of Gemini, Ollama and Local.

---

## Step 4 — Share it

Send your team and coordinator, **privately** (email or Moodle message, not a
public channel):

- the URL
- `employee@company.com`, `hr@company.com`, `admin@company.com`
- the `SEED_PASSWORD` you chose

---

## Good to know

**Sleeping.** A free service sleeps after 15 minutes without visitors. The next
visit takes about a minute to wake it. **Open the link a few minutes before any
demo.** Neon's free database also pauses when idle and wakes within a second.

**Data persists.** Deploys do not wipe the database — seeding only happens when
it is empty. Questions, uploads and leave requests your team creates stay put.

**Shared quota.** Everyone using the link spends your Gemini and Ollama free
allowances. If Gemini reports "high demand" or "quota reached", switch to Ollama
or Local. Rate limits cap each visitor at 20 questions a minute.

**Resetting the demo data.** To start clean (for example the morning of a demo),
run this locally with the Neon connection string. It deletes everything in the
hosted database and re-seeds it:

```bash
DATABASE_URL="<neon connection string>" EMBEDDING_PROVIDER=gemini SEED_PASSWORD="<your password>" npm run seed
```

**If the build fails,** open the service → **Logs**. The usual causes are a
`DATABASE_URL` copied with pooling on, or a mistyped key.
