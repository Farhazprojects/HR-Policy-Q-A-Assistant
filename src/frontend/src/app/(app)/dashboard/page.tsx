'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';

interface DashboardData {
  pendingAcknowledgements: number;
  completedAcknowledgements: number;
  policiesIndexed: number;
  leaveRequests: number;
  recentQuestion: {
    id: string; question: string; status: string; confidence: number; createdAt: string;
    topCitation: { documentTitle: string; page: number; section: string } | null;
  } | null;
  lastAcknowledgement: { title: string; acknowledgedAt: string } | null;
}

const ACTIONS = [
  { href: '/ask', title: 'Ask the HR AI', body: 'Get grounded answers from approved HR policies.', accent: 'bg-brand' },
  { href: '/search', title: 'Search Policies', body: 'Find policies, sections and documents quickly.', accent: 'bg-brand' },
  { href: '/leave', title: 'Leave Request', body: 'Start a routine leave workflow through guided self-service.', accent: 'bg-positive' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Employee Dashboard"
        description="Your central hub for HR self-service and policy information."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <Card className="flex h-[172px] flex-col p-6 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lift">
              <h2 className="text-lg font-semibold text-ink">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{a.body}</p>
              <span className={`mt-auto h-1 w-10 rounded-full ${a.accent}`} aria-hidden="true" />
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 mt-9 text-xl font-bold text-ink">Recent activity</h2>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-6">
          {loading ? (
            <>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-4 w-3/4" />
            </>
          ) : data?.recentQuestion ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-ink">
                  {data.recentQuestion.topCitation?.documentTitle ?? 'Your last question'}
                </h3>
                <StatusBadge status={data.recentQuestion.status} />
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                &ldquo;{data.recentQuestion.question}&rdquo;
              </p>
              <p className="mt-2 text-sm text-ink-subtle">
                {relativeTime(data.recentQuestion.createdAt)}
                {data.recentQuestion.topCitation
                  ? ` • ${data.recentQuestion.topCitation.documentTitle} • ${data.recentQuestion.topCitation.section}`
                  : ''}
              </p>
              <Link href="/ask" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
                Ask another question →
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-ink">No questions yet</h3>
              <p className="mt-2 text-sm text-ink-muted">
                {data?.policiesIndexed ?? 0} approved policies are indexed and ready to answer your questions.
              </p>
              <Link href="/ask" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
                Ask the HR AI →
              </Link>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink">Acknowledgements</h3>
          {loading ? (
            <Skeleton className="mt-3 h-4 w-2/3" />
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-muted">
                {data?.pendingAcknowledgements
                  ? `${data.pendingAcknowledgements} ${data.pendingAcknowledgements === 1 ? 'policy' : 'policies'} awaiting acknowledgement.`
                  : 'You are up to date — no policies awaiting acknowledgement.'}
              </p>
              {data?.lastAcknowledgement ? (
                <p className="mt-1.5 text-xs text-ink-subtle">
                  Last acknowledged: {data.lastAcknowledgement.title}
                </p>
              ) : null}
              <Link
                href="/acknowledgements"
                className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
              >
                Review acknowledgements →
              </Link>
            </>
          )}
          <span className="mt-5 block h-1 w-10 rounded-full bg-positive" aria-hidden="true" />
        </Card>
      </div>
    </>
  );
}
