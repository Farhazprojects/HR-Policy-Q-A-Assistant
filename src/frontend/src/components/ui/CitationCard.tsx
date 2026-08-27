'use client';
import { useState } from 'react';
import type { Citation } from '@/types';

/** Expandable citation card — clicking reveals the supporting policy text. */
export function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-brand-200">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-3.5 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{citation.documentTitle}</span>
          <span className="mt-1 block text-xs text-ink-muted">
            Page {citation.page} • {citation.section} • similarity {citation.similarity.toFixed(2)}
          </span>
          <span className="mt-2 block h-1 w-8 rounded-full bg-brand" aria-hidden="true" />
        </span>
        <span
          className={`mt-0.5 shrink-0 text-ink-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="animate-fade-in border-t border-line bg-canvas px-3.5 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Supporting policy text</p>
          <blockquote className="mt-2 border-l-2 border-brand-200 pl-3 text-sm leading-relaxed text-ink-muted">
            {citation.excerpt}
            {citation.excerpt.length >= 600 ? '…' : ''}
          </blockquote>
        </div>
      ) : null}
    </div>
  );
}
