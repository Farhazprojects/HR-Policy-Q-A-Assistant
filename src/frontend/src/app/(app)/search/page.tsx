'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonCard } from '@/components/ui/States';
import { api, ApiRequestError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { PolicySearchResult } from '@/types';

interface PolicyDetail {
  id: string; title: string; category: string; version: string; summary: string | null;
  pageCount: number; chunkCount: number; updatedAt: string;
  chunks: { id: string; page: number; section: string; content: string }[];
}

/** Highlights query terms in an excerpt without using dangerouslySetInnerHTML. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (
    <>
      {text.split(pattern).map((part, i) =>
        terms.includes(part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-brand-wash px-0.5 text-ink">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function PolicySearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<PolicySearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PolicyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const run = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ results: PolicySearchResult[] }>(
        `/policies/search?q=${encodeURIComponent(q)}`,
      );
      setResults(res.results);
      setSubmitted(q);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void run(''); }, []);

  const openPolicy = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get<{ policy: PolicyDetail }>(`/policies/${id}`);
      setDetail(res.policy);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not open that policy.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Policy Search"
        description="Search approved HR policy documents by keyword or natural language."
      />

      <Card className="p-5">
        <form
          onSubmit={(e: FormEvent) => { e.preventDefault(); void run(query); }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="policy-search" className="sr-only">Search policies</label>
          <input
            id="policy-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="annual leave"
            className="h-11 flex-1 rounded-lg border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-subtle focus:border-brand"
          />
          <Button type="submit" loading={loading} className="sm:w-28">Search</Button>
        </form>
      </Card>

      <h2 className="mb-4 mt-8 text-xl font-bold text-ink">
        {submitted ? 'Search results' : 'All indexed policies'}
        {!loading ? (
          <span className="ml-2 text-sm font-normal text-ink-muted">
            {results.length} {results.length === 1 ? 'policy' : 'policies'}
          </span>
        ) : null}
      </h2>

      {error ? (
        <Card><ErrorState message={error} onRetry={() => void run(submitted)} /></Card>
      ) : loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState
            title="No matching policies"
            description={`Nothing in the indexed knowledge base matched "${submitted}". Try different wording, or ask the HR AI directly.`}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <Card key={r.id} className="p-6 transition-shadow hover:shadow-lift">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-ink">{r.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Relevant sections: {r.relevantSections.length > 0 ? r.relevantSections.join(', ') : r.category}
                    {' • '}Updated {formatDate(r.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.isDemo ? <DemoBadge /> : null}
                  <Badge tone="neutral">v{r.version}</Badge>
                  {submitted ? (
                    <Badge tone="brand" title="Best passage similarity for this query">
                      match {r.score.toFixed(2)}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {r.summary ? (
                <>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-subtle">Policy summary</p>
                  <p className="mt-1 text-sm text-ink-muted">{r.summary}</p>
                </>
              ) : null}

              {r.bestMatch ? (
                <div className="mt-4 rounded-lg border border-line bg-canvas p-3.5">
                  <p className="text-xs font-medium text-ink-subtle">
                    Most relevant section — page {r.bestMatch.page} • {r.bestMatch.section}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    <Highlighted text={r.bestMatch.excerpt} query={submitted} />…
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-4">
                <Button variant="secondary" size="sm" onClick={() => void openPolicy(r.id)} loading={detailLoading}>
                  Open document
                </Button>
                <span className="text-xs text-ink-subtle">
                  {r.pageCount} pages • {r.chunkCount} indexed passages
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        description={
          detail
            ? `Version ${detail.version} • ${detail.category} • ${detail.pageCount} pages • ${detail.chunkCount} indexed passages`
            : undefined
        }
      >
        {detail ? (
          <div className="space-y-4">
            {detail.summary ? <p className="text-sm text-ink-muted">{detail.summary}</p> : null}
            {detail.chunks.map((c) => (
              <div key={c.id} className="border-l-2 border-line pl-3.5">
                <p className="text-xs font-medium text-ink-subtle">Page {c.page} • {c.section}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  <Highlighted text={c.content} query={submitted} />
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
