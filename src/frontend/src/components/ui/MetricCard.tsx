import type { ReactNode } from 'react';
import { cn } from './cn';
import { Skeleton } from './States';

export function MetricCard({
  label, value, sublabel, accent = 'brand', loading, badge,
}: {
  label: string; value: ReactNode; sublabel?: string;
  accent?: 'brand' | 'positive' | 'caution' | 'danger';
  loading?: boolean; badge?: ReactNode;
}) {
  const accents = {
    brand: 'bg-brand', positive: 'bg-positive', caution: 'bg-caution', danger: 'bg-danger',
  } as const;

  return (
    <div className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {badge}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      )}
      {sublabel ? <p className="mt-1 text-sm text-ink-muted">{sublabel}</p> : null}
      <span className={cn('mt-4 h-1 w-10 rounded-full', accents[accent])} aria-hidden="true" />
    </div>
  );
}
