'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, ApiRequestError } from '@/lib/api';
import { formatDate, LEAVE_TYPE_LABELS } from '@/lib/format';
import type { LeaveRequest } from '@/types';

const LEAVE_TYPES = Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function LeaveRequestPage() {
  const { push } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(false);

  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = () =>
    api.get<{ requests: LeaveRequest[] }>('/leave')
      .then((r) => setRequests(r.requests))
      .catch(() => undefined)
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!startDate) e.startDate = 'Please choose a start date.';
    if (!endDate) e.endDate = 'Please choose an end date.';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      e.endDate = 'The end date cannot be before the start date.';
    }
    if (reason.trim().length < 3) e.reason = 'Please give a brief reason (at least 3 characters).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const totalDays =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1
      : 0;

  const onReview = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) setReview(true);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/leave', { leaveType, startDate, endDate, reason });
      push('Leave request submitted.', 'success');
      setReview(false);
      setStartDate(''); setEndDate(''); setReason(''); setLeaveType('ANNUAL');
      await load();
    } catch (err) {
      push(err instanceof ApiRequestError ? err.message : 'Could not submit your request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Leave Request"
        description="Guided self-service workflow for initiating a leave request."
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Start a leave request</h2>
          <form onSubmit={onReview} className="mt-5 space-y-4" noValidate>
            <Select
              label="Leave type"
              options={LEAVE_TYPES}
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Start date" type="date" value={startDate} min={todayIso()}
                onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} required
              />
              <Input
                label="End date" type="date" value={endDate} min={startDate || todayIso()}
                onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} required
              />
            </div>
            {totalDays > 0 ? (
              <div className="rounded-lg border border-line bg-canvas px-3.5 py-2.5">
                <p className="text-sm text-ink-muted">
                  Duration: <span className="font-semibold text-ink">{totalDays} calendar day{totalDays === 1 ? '' : 's'}</span>
                </p>
              </div>
            ) : null}
            <Textarea
              label="Reason" value={reason} maxLength={500}
              placeholder="Personal leave"
              onChange={(e) => setReason(e.target.value)}
              error={errors.reason}
              hint={`${reason.length}/500 characters`}
              required
            />
            <Button type="submit" size="lg" className="w-full">Review request</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Next step</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              The full capstone will connect this workflow to appropriate business rules and approval
              processes. Demonstrates the intended agentic self-service journey.
            </p>
            <div className="mt-4 rounded-lg border border-caution/25 bg-caution-wash p-3.5">
              <p className="text-xs font-semibold text-caution">Academic prototype scope</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Requests submitted here are genuinely stored in the project database and appear below.
                No connection to a payroll or enterprise HR platform is made, and no entitlement
                balance is calculated or deducted.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Your requests</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState title="No leave requests yet" description="Submitted requests will appear here." />
            ) : (
              <ul className="mt-4 space-y-3">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{LEAVE_TYPE_LABELS[r.leaveType]}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {formatDate(r.startDate)} → {formatDate(r.endDate)} • {r.totalDays} day{r.totalDays === 1 ? '' : 's'}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-sm text-ink-muted">{r.reason}</p>
                    <p className="mt-1.5 text-xs text-ink-subtle">Submitted {formatDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={review}
        onClose={() => setReview(false)}
        title="Review your leave request"
        description="Check the details below before submitting."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReview(false)} disabled={submitting}>Back</Button>
            <Button onClick={onSubmit} loading={submitting}>Submit request</Button>
          </>
        }
      >
        <dl className="space-y-3">
          {[
            ['Leave type', LEAVE_TYPE_LABELS[leaveType]],
            ['Start date', startDate ? formatDate(startDate) : '—'],
            ['End date', endDate ? formatDate(endDate) : '—'],
            ['Duration', `${totalDays} calendar day${totalDays === 1 ? '' : 's'}`],
            ['Reason', reason],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
              <dt className="text-sm text-ink-muted">{k}</dt>
              <dd className="text-right text-sm font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Badge tone="caution" className="mt-4">Prototype workflow — no payroll integration</Badge>
      </Modal>
    </>
  );
}
