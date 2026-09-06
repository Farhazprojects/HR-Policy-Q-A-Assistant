'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DemoBadge, PrototypeBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { BarChart, CHART_COLOURS, Meter, ShareBar } from '@/components/ui/Charts';
import { MetricCard } from '@/components/ui/MetricCard';
import { ErrorState } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, ApiRequestError } from '@/lib/api';
import { formatDate, formatNumber, formatPercent, relativeTime } from '@/lib/format';

interface HrDashboard {
  metrics: {
    policiesIndexed: number; questions: number; acknowledgementRate: number;
    acknowledgementTotal: number; acknowledgementDone: number; averageConfidence: number;
  };
  charts: {
    outcomes: { grounded: number; fallback: number; error: number };
    confidenceBands: { HIGH: number; MEDIUM: number; LOW: number };
    categories: { label: string; value: number }[];
    mostCited: { label: string; value: number }[];
  };
  recentUploads: { id: string; title: string; version: string; status: string; pageCount: number; chunkCount: number; createdAt: string; isDemo: boolean }[];
  recentQuestions: { id: string; question: string; status: string; confidence: number; createdAt: string; user: { name: string } }[];
}

const TOOLS = [
  { href: '/hr/upload', title: 'Upload Policy', body: 'Add approved PDF documents to the HR knowledge base.', live: true },
  { href: '/hr/library', title: 'Policy Library', body: 'Review uploaded policies and versions.', live: true },
  { href: null, title: 'Draft Generator', body: 'Prototype placeholder for future AI-assisted drafting.', live: false },
  { href: null, title: 'Policy Review Reminders', body: 'Upcoming annual policy reviews and maintenance actions.', live: false },
  { href: null, title: 'Analytics', body: 'Prototype placeholder for usage and trend analysis.', live: false },
  { href: null, title: 'Notifications', body: 'Prototype placeholder for HR communications.', live: false },
];

export default function HrDashboardPage() {
  const [data, setData] = useState<HrDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<HrDashboard>('/hr/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : 'Could not load the dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Card><ErrorState message={error} /></Card>;

  return (
    <>
      <PageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="HR Officer Dashboard"
        description="Manage the HR knowledge base and monitor employee self-service."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Policies" loading={loading}
          value={formatNumber(data?.metrics.policiesIndexed ?? 0)}
          sublabel="approved documents indexed" accent="brand"
        />
        <MetricCard
          label="Questions" loading={loading}
          value={formatNumber(data?.metrics.questions ?? 0)}
          sublabel="employee questions asked" accent="brand"
        />
        <MetricCard
          label="Acknowledgements" loading={loading}
          value={formatPercent(data?.metrics.acknowledgementRate ?? 0)}
          sublabel={`${data?.metrics.acknowledgementDone ?? 0} of ${data?.metrics.acknowledgementTotal ?? 0} completed`}
          accent="positive"
        />
        <MetricCard
          label="AI Accuracy" loading={loading}
          value={formatPercent(data?.metrics.averageConfidence ?? 0)}
          sublabel="mean retrieval confidence" accent="positive"
        />
      </div>

      <p className="mt-3 text-xs text-ink-subtle">
        All figures are live database queries. &ldquo;AI Accuracy&rdquo; is the mean
        retrieval-derived confidence of grounded answers — it is not a measured
        answer-correctness rate.
      </p>

      <h2 className="mb-1 mt-9 text-xl font-bold text-ink">Knowledge base insight</h2>
      <p className="mb-4 text-sm text-ink-muted">
        Measured from the questions employees have actually asked and the evidence
        retrieved to answer them.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink">Answer outcomes</h3>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            How often the knowledge base could support an answer.
          </p>
          <ShareBar
            segments={[
              { label: 'Grounded', value: data?.charts.outcomes.grounded ?? 0, colour: CHART_COLOURS.grounded },
              { label: 'Refused', value: data?.charts.outcomes.fallback ?? 0, colour: CHART_COLOURS.fallback },
              { label: 'Error', value: data?.charts.outcomes.error ?? 0, colour: CHART_COLOURS.error },
            ]}
            caption="A refusal is a correct outcome when no approved policy covers the question. A rising share suggests a gap in the knowledge base rather than a fault in the assistant."
          />

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-base font-semibold text-ink">Retrieval confidence</h3>
            <p className="mb-4 mt-1 text-sm text-ink-muted">
              Strength of the evidence behind each answer, not a correctness rate.
            </p>
            <BarChart
              data={[
                { label: 'High (≥ 80%)', value: data?.charts.confidenceBands.HIGH ?? 0 },
                { label: 'Medium (60–79%)', value: data?.charts.confidenceBands.MEDIUM ?? 0 },
                { label: 'Low (< 60%)', value: data?.charts.confidenceBands.LOW ?? 0 },
              ]}
              unit=" questions"
              unitOne=" question"
              emptyMessage="No questions have been asked yet."
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink">Most-relied-upon policies</h3>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            How often a passage from each document was cited as evidence.
          </p>
          <BarChart
            data={data?.charts.mostCited ?? []}
            unit=" citations"
            unitOne=" citation"
            emptyMessage="No answers have cited a policy yet."
          />

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-base font-semibold text-ink">Indexed policies by category</h3>
            <p className="mb-4 mt-1 text-sm text-ink-muted">Coverage of the knowledge base.</p>
            <BarChart
              data={data?.charts.categories ?? []}
              unit=" policies"
              unitOne=" policy"
              emptyMessage="No policies are indexed yet."
            />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <Meter
              label="Policy acknowledgement completion"
              value={data?.metrics.acknowledgementDone ?? 0}
              total={data?.metrics.acknowledgementTotal ?? 0}
              caption="assignments completed"
            />
          </div>
        </Card>
      </div>

      <h2 className="mb-4 mt-9 text-xl font-bold text-ink">HR tools</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const inner = (
            <Card
              className={`flex h-[152px] flex-col p-5 transition-all duration-200 ${
                t.live ? 'group-hover:-translate-y-0.5 group-hover:shadow-lift' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{t.title}</h3>
                {t.live ? null : <PrototypeBadge />}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.body}</p>
              <span
                className={`mt-auto h-1 w-10 rounded-full ${t.live ? 'bg-brand' : 'bg-line'}`}
                aria-hidden="true"
              />
            </Card>
          );
          return t.href ? (
            <Link key={t.title} href={t.href} className="group">{inner}</Link>
          ) : (
            <div key={t.title} title="Prototype placeholder — not implemented in this capstone stage">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Recent policy uploads</h2>
          <ul className="mt-4 space-y-3">
            {data?.recentUploads.length ? (
              data.recentUploads.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{u.title}</p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      v{u.version} • {u.pageCount} pages • {u.chunkCount} chunks • {formatDate(u.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {u.isDemo ? <DemoBadge /> : null}
                    <StatusBadge status={u.status} />
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-muted">No policies uploaded yet.</li>
            )}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Recent employee questions</h2>
          <ul className="mt-4 space-y-3">
            {data?.recentQuestions.length ? (
              data.recentQuestions.map((q) => (
                <li key={q.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-ink">{q.question}</p>
                    <StatusBadge status={q.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {q.user.name} • {relativeTime(q.createdAt)}
                    {q.status === 'GROUNDED' ? ` • confidence ${formatPercent(q.confidence)}` : ''}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-muted">No questions asked yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
