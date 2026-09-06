'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiRequestError } from '@/lib/api';
import { AUDIT_EVENT_LABELS, formatNumber, formatPercent, relativeTime } from '@/lib/format';

interface Governance {
  knowledgeBase: { policiesIndexed: number; policiesTotal: number; chunkCount: number; demoPolicies: number };
  ai: {
    totalQuestions: number; groundedAnswers: number; fallbacks: number; errorAnswers: number;
    groundingRate: number; fallbackRate: number; lowConfidenceAnswers: number;
    averageTopSimilarity: number; averageConfidence: number;
  };
  retrieval: {
    threshold: number; topK: number; similarityFunction: string;
    embeddingProvider: string; embeddingModel: string; isNeuralEmbedding: boolean;
  };
  generation: { provider: string; model: string; isGenerative: boolean; demoMode: boolean };
  accessControl: { roles: { role: string; count: number }[]; totalUsers: number };
  activity: {
    acknowledgementTotal: number; acknowledgementDone: number; acknowledgementRate: number;
    leaveRequests: number; auditEvents: number;
  };
  demoDataPresent: boolean;
  generatedAt: string;
}

interface Activity {
  id: string; event: string; entity: string | null; createdAt: string;
  metadata: Record<string, unknown> | null;
  actor: { name: string; role: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee', HR_OFFICER: 'HR Officer', ADMIN: 'Administrator',
};

/** Simple stacked bar — grounded vs fallback share of all questions. */
function GroundingBar({ grounded, fallback, errors }: { grounded: number; fallback: number; errors: number }) {
  const total = Math.max(1, grounded + fallback + errors);
  const seg = [
    { label: 'Grounded', value: grounded, color: 'bg-positive' },
    { label: 'Fallback', value: fallback, color: 'bg-caution' },
    { label: 'Error', value: errors, color: 'bg-danger' },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-line" role="img"
           aria-label={`${grounded} grounded, ${fallback} fallback, ${errors} error responses`}>
        {seg.map((s) => (
          <div key={s.label} className={s.color} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {seg.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} aria-hidden="true" />
            <span className="text-xs text-ink-muted">
              {s.label} <span className="font-semibold text-ink">{formatNumber(s.value)}</span>
              <span className="text-ink-subtle"> ({formatPercent(s.value / total)})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GovernancePage() {
  const [data, setData] = useState<Governance | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Governance>('/admin/governance'),
      api.get<{ activity: Activity[] }>('/admin/activity?limit=15'),
    ])
      .then(([g, a]) => { setData(g); setActivity(a.activity); setError(null); })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : 'Could not load governance metrics.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (error) return <Card><ErrorState message={error} onRetry={load} /></Card>;

  return (
    <>
      <PageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="AI Governance Dashboard"
        description="Monitor AI usage, policy grounding, permissions and audit activity."
        action={data?.demoDataPresent ? <DemoBadge /> : undefined}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Policies indexed" loading={loading} accent="brand"
          value={formatNumber(data?.knowledgeBase.policiesIndexed ?? 0)}
          sublabel={`${formatNumber(data?.knowledgeBase.chunkCount ?? 0)} indexed passages`} />
        <MetricCard label="AI questions" loading={loading} accent="brand"
          value={formatNumber(data?.ai.totalQuestions ?? 0)}
          sublabel="all time" />
        <MetricCard label="Grounded answers" loading={loading} accent="positive"
          value={formatNumber(data?.ai.groundedAnswers ?? 0)}
          sublabel={data ? `${formatPercent(data.ai.groundingRate)} of questions` : undefined} />
        <MetricCard label="Fallbacks" loading={loading} accent="caution"
          value={formatNumber(data?.ai.fallbacks ?? 0)}
          sublabel={data ? `${formatPercent(data.ai.fallbackRate)} refused safely` : undefined} />
      </div>

      <h2 className="mb-4 mt-9 text-xl font-bold text-ink">Governance monitoring</h2>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink">Retrieval quality</h3>
          {loading || !data ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-muted">
                Average top-result similarity: {data.ai.averageTopSimilarity.toFixed(2)} • Threshold: {data.retrieval.threshold}
              </p>
              <div className="mt-4">
                <GroundingBar
                  grounded={data.ai.groundedAnswers}
                  fallback={data.ai.fallbacks}
                  errors={data.ai.errorAnswers}
                />
              </div>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                {[
                  ['Mean retrieval confidence', formatPercent(data.ai.averageConfidence)],
                  ['Low-confidence grounded answers', formatNumber(data.ai.lowConfidenceAnswers)],
                  ['Top-K retrieved per question', `${data.retrieval.topK}`],
                  ['Similarity function', data.retrieval.similarityFunction],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink">Access control</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Role-based access: Employee, HR Officer, Administrator
          </p>
          {loading || !data ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : (
            <>
              <ul className="mt-4 space-y-2.5">
                {data.accessControl.roles.map((r) => (
                  <li key={r.role} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-muted">{ROLE_LABELS[r.role] ?? r.role}</span>
                    <span className="text-sm font-semibold text-ink">
                      {r.count} account{r.count === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-subtle">
                Employees may ask questions, search policies, request leave and acknowledge policies.
                HR Officers additionally upload and manage policies. Administrators additionally
                access governance and system monitoring. Denied attempts are recorded as
                ACCESS_DENIED audit events.
              </p>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink">Responsible AI</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Grounding, transparency, human oversight and refusal path.
          </p>
          {loading || !data ? (
            <Skeleton className="mt-4 h-32 w-full" />
          ) : (
            <ul className="mt-4 space-y-3">
              {[
                ['Grounding', 'Answers are generated only from retrieved passages of approved policy documents.'],
                ['Refusal path', `When no passage reaches the ${data.retrieval.threshold} threshold, the assistant refuses and the language model is not called at all.`],
                ['Transparency', 'Every answer carries citations to document, page and section, plus retrieval scores.'],
                ['Confidence', 'Calculated by the application from retrieval evidence — never self-reported by the model.'],
                ['Human oversight', 'The assistant supports, and does not replace, HR professional judgement.'],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-ink">{title}</p>
                    <p className="text-xs leading-relaxed text-ink-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink">Active configuration</h3>
          {loading || !data ? (
            <Skeleton className="mt-4 h-32 w-full" />
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.generation.demoMode ? <Badge tone="caution">DEMO_MODE enabled</Badge> : null}
                <Badge tone={data.generation.isGenerative ? 'positive' : 'caution'}>
                  {data.generation.isGenerative ? 'Generative model' : 'Extractive (no language model)'}
                </Badge>
                <Badge tone={data.retrieval.isNeuralEmbedding ? 'positive' : 'caution'}>
                  {data.retrieval.isNeuralEmbedding ? 'Neural embeddings' : 'Lexical embeddings'}
                </Badge>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ['Generation provider', data.generation.provider],
                  ['Generation model', data.generation.model],
                  ['Embedding provider', data.retrieval.embeddingProvider],
                  ['Embedding model', data.retrieval.embeddingModel],
                  ['Retrieval threshold', `${data.retrieval.threshold}`],
                  ['Total audit events', formatNumber(data.activity.auditEvents)],
                  ['Leave requests', formatNumber(data.activity.leaveRequests)],
                  ['Acknowledgement completion', formatPercent(data.activity.acknowledgementRate)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                Every figure on this page is a live database query, generated {relativeTime(data.generatedAt)}.
                {data.demoDataPresent
                  ? ' Seeded demonstration policies are present and marked DEMO DATA.'
                  : ''}
              </p>
            </>
          )}
        </Card>
      </div>

      <h2 className="mb-4 mt-9 text-xl font-bold text-ink">Audit activity</h2>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6"><Skeleton className="h-48 w-full" /></div>
        ) : activity.length === 0 ? (
          <div className="p-6"><p className="text-sm text-ink-muted">No audit events recorded yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-canvas">
                <tr className="text-xs uppercase tracking-wide text-ink-subtle">
                  <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Actor</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">
                      {AUDIT_EVENT_LABELS[a.event] ?? a.event}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{a.actor?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-muted">
                      {a.actor ? ROLE_LABELS[a.actor.role] ?? a.actor.role : '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-subtle">{relativeTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-ink-subtle">
        Audit records store the actor, event type, timestamp and non-sensitive metadata only.
        Question text and policy content are not duplicated into the audit log.
      </p>
    </>
  );
}
