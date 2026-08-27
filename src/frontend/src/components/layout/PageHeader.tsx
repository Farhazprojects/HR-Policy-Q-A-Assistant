import type { ReactNode } from 'react';

export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-[15px] text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
