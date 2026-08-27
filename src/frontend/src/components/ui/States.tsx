import type { ReactNode } from 'react';
import { cn } from './cn';

export function EmptyState({
  title, description, action, icon,
}: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink-subtle">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-wash text-lg font-bold text-danger">
        !
      </div>
      <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card">
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
    </div>
  );
}

/** Three-dot indicator shown while the assistant is retrieving and answering. */
export function TypingIndicator({ label = 'The assistant is working' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" aria-label={label} role="status">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand"
            style={{ animation: `pulse-dot 1.2s ${i * 0.18}s infinite ease-in-out` }}
          />
        ))}
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
