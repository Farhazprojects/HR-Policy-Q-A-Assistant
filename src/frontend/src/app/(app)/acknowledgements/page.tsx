'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { api, ApiRequestError } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import type { AcknowledgementRow } from '@/types';

interface AckData {
  pending: AcknowledgementRow[];
  completed: AcknowledgementRow[];
  pendingCount: number;
  completedCount: number;
}

export default function AcknowledgementsPage() {
  const { push } = useToast();
  const [data, setData] = useState<AckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AcknowledgementRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get<AckData>('/acknowledgements')
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const confirm = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await api.post(`/acknowledgements/${target.document.id}`);
      push(`You acknowledged the ${target.document.title}.`, 'success');
      setTarget(null);
      await load();
    } catch (err) {
      push(err instanceof ApiRequestError ? err.message : 'Could not record your acknowledgement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="Policy Acknowledgements"
        description="Review and acknowledge policies assigned to you."
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Awaiting your acknowledgement</h2>
            {data ? <Badge tone={data.pendingCount > 0 ? 'caution' : 'positive'}>{data.pendingCount}</Badge> : null}
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !data || data.pending.length === 0 ? (
            <EmptyState
              title="You are up to date"
              description="There are no policies awaiting your acknowledgement."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.pending.map((row) => (
                <li key={row.id} className="rounded-lg border border-line p-4 transition-colors hover:border-brand-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{row.document.title}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Assigned {formatDate(row.assignedAt)} • Version {row.policyVersion}
                      </p>
                      {row.document.summary ? (
                        <p className="mt-2 text-sm text-ink-muted">{row.document.summary}</p>
                      ) : null}
                    </div>
                    <Button onClick={() => setTarget(row)}>Acknowledge</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Completed</h2>
          {loading ? (
            <Skeleton className="mt-4 h-6 w-32" />
          ) : (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                {data?.completedCount ?? 0}
              </p>
              <p className="text-sm text-ink-muted">
                {data?.completedCount === 1 ? 'policy acknowledged' : 'policies acknowledged'}
              </p>

              {data && data.completed.length > 0 ? (
                <ul className="mt-5 space-y-3 border-t border-line pt-4">
                  {data.completed.map((row) => (
                    <li key={row.id}>
                      <p className="text-sm font-medium text-ink">{row.document.title}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        v{row.policyVersion} • acknowledged {row.acknowledgedAt ? formatDateTime(row.acknowledgedAt) : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-subtle">
                This supports the proposed employee policy acknowledgement functionality. Each
                acknowledgement is stored with a timestamp and recorded in the audit log.
              </p>
            </>
          )}
          <span className="mt-4 block h-1 w-10 rounded-full bg-positive" aria-hidden="true" />
        </Card>
      </div>

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={confirm}
        loading={saving}
        confirmLabel="I acknowledge this policy"
        title={`Acknowledge ${target?.document.title ?? ''}?`}
        description={`Confirming records that you have read and understood version ${target?.policyVersion ?? ''} of this policy. The date and time will be stored against your account.`}
      />
    </>
  );
}
