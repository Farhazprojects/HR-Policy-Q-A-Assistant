'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, ApiRequestError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Policy } from '@/types';

export default function PolicyLibraryPage() {
  const { push } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Policy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<{ policies: Policy[] }>('/policies')
      .then((r) => { setPolicies(r.policies); setError(null); })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : 'Could not load policies.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await api.delete(`/policies/${target.id}`);
      push(`"${target.title}" was removed from the knowledge base.`, 'success');
      setTarget(null);
      load();
    } catch (err) {
      push(err instanceof ApiRequestError ? err.message : 'Could not remove that policy.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        backTo="/hr/dashboard"
        backLabel="HR Dashboard"
        title="Policy Library"
        description="Review uploaded policies and versions."
      />

      {error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : loading ? (
        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
      ) : policies.length === 0 ? (
        <Card>
          <EmptyState
            title="No policies in the knowledge base"
            description="Upload an approved PDF policy to make it searchable and available to the AI assistant."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line bg-canvas">
                <tr className="text-xs uppercase tracking-wide text-ink-subtle">
                  <th scope="col" className="px-5 py-3 font-semibold">Policy</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Version</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Indexed content</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Updated</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{p.title}</span>
                        {p.isDemo ? <DemoBadge /> : null}
                      </div>
                      {p.requiresAcknowledgement ? (
                        <Badge tone="brand" className="mt-1.5">Acknowledgement required</Badge>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{p.category}</td>
                    <td className="px-5 py-4 text-ink-muted">v{p.version}</td>
                    <td className="px-5 py-4 text-ink-muted">
                      {p.pageCount} pages • {p.chunkCount} chunks
                      {p.embeddingModel ? (
                        <span className="mt-0.5 block text-xs text-ink-subtle">{p.embeddingModel}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{formatDate(p.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                      {p.statusMessage ? (
                        <span className="mt-1 block max-w-[180px] text-xs text-danger">{p.statusMessage}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setTarget(p)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        confirmLabel="Remove policy"
        title={`Remove ${target?.title ?? ''}?`}
        description="This deletes the document, its indexed chunks and embeddings from the knowledge base. The AI assistant will no longer be able to cite it. This cannot be undone."
      />
    </>
  );
}
