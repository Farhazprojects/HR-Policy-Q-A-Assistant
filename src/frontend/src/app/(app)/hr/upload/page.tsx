'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { ProgressSteps, type Step } from '@/components/ui/ProgressSteps';
import { UploadZone } from '@/components/ui/UploadZone';
import { useToast } from '@/components/ui/Toast';
import { api, ApiRequestError } from '@/lib/api';

interface UploadResult {
  documentId: string; title: string; pageCount: number;
  chunkCount: number; status: string; embeddingModel: string;
}

const INITIAL_STEPS: Step[] = [
  { key: 'upload', label: 'Uploading document', state: 'pending' },
  { key: 'extract', label: 'Extracting text from PDF', state: 'pending' },
  { key: 'chunk', label: 'Chunking by page and section', state: 'pending' },
  { key: 'embed', label: 'Generating embeddings', state: 'pending' },
  { key: 'index', label: 'Indexing into the knowledge base', state: 'pending' },
];

export default function UploadPolicyPage() {
  const { push } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('1.0');
  const [summary, setSummary] = useState('');
  const [requiresAck, setRequiresAck] = useState(false);

  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStep = (index: number, state: Step['state']) =>
    setSteps((s) => s.map((x, i) => (i === index ? { ...x, state } : x)));

  const chooseFile = (f: File) => {
    setFile(f);
    setError(null);
    setResult(null);
    setSteps(INITIAL_STEPS);
    if (!title) {
      setTitle(
        f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()).trim(),
      );
    }
  };

  const reset = () => {
    setFile(null); setTitle(''); setCategory(''); setVersion('1.0');
    setSummary(''); setRequiresAck(false); setResult(null);
    setError(null); setSteps(INITIAL_STEPS);
  };

  const submit = async () => {
    if (!file || !title.trim()) {
      setError('Please choose a PDF and give the policy a title.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);

    // The server performs extraction, chunking, embedding and indexing in one
    // request; these timed transitions reflect that sequence for the operator.
    setSteps(INITIAL_STEPS.map((s, i) => (i === 0 ? { ...s, state: 'active' } : s)));
    const timers = [
      setTimeout(() => { setStep(0, 'done'); setStep(1, 'active'); }, 500),
      setTimeout(() => { setStep(1, 'done'); setStep(2, 'active'); }, 1100),
      setTimeout(() => { setStep(2, 'done'); setStep(3, 'active'); }, 1700),
    ];

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim());
      if (category.trim()) form.append('category', category.trim());
      if (version.trim()) form.append('version', version.trim());
      if (summary.trim()) form.append('summary', summary.trim());
      form.append('requiresAcknowledgement', String(requiresAck));

      const res = await api.post<{ document: UploadResult }>('/policies/upload', form);

      timers.forEach(clearTimeout);
      setSteps((s) => s.map((x, i) => ({ ...x, state: i === 4 ? 'done' : 'done' })));
      setResult(res.document);
      push(`"${res.document.title}" is now indexed and searchable.`, 'success');
    } catch (err) {
      timers.forEach(clearTimeout);
      const message =
        err instanceof ApiRequestError ? err.message : 'The policy could not be processed.';
      setError(message);
      setSteps((s) => {
        const failedAt = s.findIndex((x) => x.state === 'active');
        return s.map((x, i) => (i === (failedAt === -1 ? 0 : failedAt) ? { ...x, state: 'failed' } : x));
      });
      push(message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload HR Policy"
        description="Upload an approved PDF to add it to the policy knowledge base."
      />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Upload approved policy document</h2>
            <div className="mt-4">
              <UploadZone onFile={chooseFile} disabled={processing} maxMb={20} />
            </div>

            {file ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                  <p className="text-xs text-ink-subtle">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} disabled={processing}>Remove</Button>
              </div>
            ) : null}
          </Card>

          {file ? (
            <Card className="animate-slide-up p-6">
              <h2 className="text-lg font-semibold text-ink">Policy details</h2>
              <div className="mt-4 space-y-4">
                <Input
                  label="Policy title" value={title} required disabled={processing}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Employee Wellbeing and Support Policy"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Category" value={category} disabled={processing}
                    onChange={(e) => setCategory(e.target.value)} placeholder="Wellbeing"
                  />
                  <Input
                    label="Version" value={version} disabled={processing}
                    onChange={(e) => setVersion(e.target.value)} placeholder="1.0"
                  />
                </div>
                <Textarea
                  label="Summary" value={summary} maxLength={500} disabled={processing}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Short description shown in Policy Search results."
                />
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3.5">
                  <input
                    type="checkbox" checked={requiresAck} disabled={processing}
                    onChange={(e) => setRequiresAck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#5440CC]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">Requires employee acknowledgement</span>
                    <span className="block text-xs text-ink-muted">
                      Assigns this policy to employees for acknowledgement once indexed.
                    </span>
                  </span>
                </label>

                {error ? (
                  <div className="rounded-lg border border-danger/25 bg-danger-wash px-3.5 py-3" role="alert">
                    <p className="text-sm font-medium text-danger">{error}</p>
                  </div>
                ) : null}

                <Button size="lg" className="w-full" onClick={submit} loading={processing}>
                  {processing ? 'Processing…' : 'Upload and index policy'}
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Processing pipeline</h2>
            <p className="mt-1 text-sm text-ink-muted">
              PDF extraction → Chunking → Embeddings → Knowledge base
            </p>
            <div className="mt-5">
              <ProgressSteps steps={steps} />
            </div>

            {result ? (
              <div className="mt-5 animate-slide-up rounded-lg border border-positive/25 bg-positive-wash p-4">
                <p className="text-sm font-semibold text-positive">Indexing complete</p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Policy</dt>
                    <dd className="text-right font-medium text-ink">{result.title}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Pages</dt>
                    <dd className="font-medium text-ink">{result.pageCount}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Chunks</dt>
                    <dd className="font-medium text-ink">{result.chunkCount}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Status</dt>
                    <dd><Badge tone="positive">Indexed</Badge></dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Embedding model</dt>
                    <dd className="text-right text-xs font-medium text-ink">{result.embeddingModel}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-muted">
                  This document is now retrievable by Ask AI and Policy Search.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/ask">
                    <Button size="sm">Ask a question about it</Button>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={reset}>Upload another</Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink">Governance note</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Only approved organisational HR policy documents should be added to the knowledge base.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
              Uploads are restricted to HR Officer and Administrator accounts, validated as PDFs,
              size-limited, and recorded in the audit log against your account.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
