'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api';

interface Health {
  status: string; demoMode: boolean; indexedChunks: number;
  retrieval: { topK: number; threshold: number };
  embedding: { provider: string; model: string; isNeural: boolean; similarityFunction: string; ok: boolean; message: string };
  llm: { provider: string; model: string; isGenerative: boolean; ok: boolean; message: string };
}

const LAYERS = [
  {
    title: 'Employee / HR',
    subtitle: 'Questions, search, workflows',
    detail: 'Employee, HR Officer and Administrator roles sign in and are authorised per request.',
    tone: 'bg-ink',
  },
  {
    title: 'Next.js Frontend',
    subtitle: 'Dashboards and conversational UI',
    detail: 'React 19 App Router with a Tailwind design system reproducing the approved prototype.',
    tone: 'bg-brand',
  },
  {
    title: 'Express API',
    subtitle: 'Authentication and business services',
    detail: 'TypeScript REST API with JWT sessions, role middleware, validation and rate limiting.',
    tone: 'bg-brand',
  },
  {
    title: 'RAG Engine',
    subtitle: 'Embedding + semantic retrieval + grounded generation',
    detail: 'Query embedding → vector search → threshold filter → context assembly → grounded generation, with a refusal path taken before any model call.',
    tone: 'bg-brand',
  },
  {
    title: 'HR Policy Knowledge Base',
    subtitle: 'Approved PDFs, chunks, embeddings, citations',
    detail: 'PostgreSQL via Prisma. Documents are page-aware chunked and embedded on upload.',
    tone: 'bg-positive',
  },
];

const SUPPORTING = [
  ['PostgreSQL / Prisma', 'Users, policy documents and chunks, questions and citations, leave requests, acknowledgements, audit logs.'],
  ['AI Embedding Service', 'Provider abstraction: Gemini, Ollama, or the deterministic local lexical model.'],
  ['LLM Service', 'Provider abstraction: Gemini, Ollama, or extractive composition in offline demo mode.'],
  ['Document Processing', 'PDF text extraction, page-aware chunking, section detection, embedding generation.'],
  ['Authentication / Authorisation', 'bcrypt password hashing, JWT in an httpOnly cookie, role-based route protection.'],
  ['Audit Logging', 'Sign-in, AI query, grounded answer, fallback, upload, indexing, acknowledgement and access-denied events.'],
  ['Explainability', 'Citations to document, page and section, similarity scores, and retrieval-derived confidence.'],
];

export default function SystemOverviewPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Health>('/health').then(setHealth).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="System Overview"
        description="How the proposed system connects users, HR knowledge, RAG and governance."
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Request flow</h2>
          <ol className="mt-5 space-y-1">
            {LAYERS.map((layer, i) => (
              <li key={layer.title}>
                <div className="rounded-lg border border-line bg-canvas p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${layer.tone}`} aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-ink">{layer.title}</p>
                      <p className="text-sm text-ink-muted">{layer.subtitle}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">{layer.detail}</p>
                    </div>
                  </div>
                </div>
                {i < LAYERS.length - 1 ? (
                  <div className="flex justify-center py-1" aria-hidden="true">
                    <span className="text-ink-subtle">↓</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-lg border border-brand-200 bg-brand-wash p-4">
            <p className="font-semibold text-brand-dark">Governance Layer</p>
            <p className="text-sm text-ink-muted">
              Permissions, audit logs, confidence and monitoring
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Cross-cuts every layer: role checks on each request, audit records for every
              significant event, and retrieval-derived confidence attached to every answer.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Live service status</h2>
              {loading ? null : (
                <Badge tone={health?.status === 'ok' ? 'positive' : 'danger'}>
                  {health?.status === 'ok' ? 'Operational' : 'Unavailable'}
                </Badge>
              )}
            </div>

            {loading ? (
              <Skeleton className="mt-4 h-40 w-full" />
            ) : !health ? (
              <p className="mt-3 text-sm text-ink-muted">The API could not be reached.</p>
            ) : (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    ['Indexed passages', `${health.indexedChunks}`],
                    ['Top-K', `${health.retrieval.topK}`],
                    ['Retrieval threshold', `${health.retrieval.threshold}`],
                    ['Embedding provider', `${health.embedding.provider} (${health.embedding.model})`],
                    ['Similarity function', health.embedding.similarityFunction],
                    ['Generation provider', `${health.llm.provider} (${health.llm.model})`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{k}</dt>
                      <dd className="text-right font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-2">
                    {health.demoMode ? <Badge tone="caution">DEMO_MODE</Badge> : null}
                    <Badge tone={health.llm.isGenerative ? 'positive' : 'caution'}>
                      {health.llm.isGenerative ? 'Generative' : 'Extractive'}
                    </Badge>
                    <Badge tone={health.embedding.isNeural ? 'positive' : 'caution'}>
                      {health.embedding.isNeural ? 'Neural embeddings' : 'Lexical embeddings'}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-subtle">{health.embedding.message}</p>
                  <p className="text-xs leading-relaxed text-ink-subtle">{health.llm.message}</p>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Supporting services</h2>
            <ul className="mt-4 space-y-3">
              {SUPPORTING.map(([title, body]) => (
                <li key={title}>
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="text-xs leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Project</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              COIT20254 Information Systems Project — CQUniversity Australia.
              AI-Powered HR Policy Knowledge Management System Using Retrieval-Augmented
              Generation and Explainable Artificial Intelligence.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-subtle">
              <li>Farhaz Khondoker — AI &amp; Technical Lead / Full-Stack Developer</li>
              <li>Isuru Koswaththa — Project Manager &amp; Business Analysis Lead</li>
              <li>Dineli Jayandee Gampolage — Business Analysis &amp; Documentation / Quality Lead</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
