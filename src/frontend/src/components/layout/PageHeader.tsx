'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
  backTo,
  backLabel = 'Back',
  showBack = true,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Destination for the back control. Omit to fall back to browser history. */
  backTo?: string;
  backLabel?: string;
  /** Set false to hide the back control on top-level pages such as the dashboard. */
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="mb-7">
      {showBack ? (
      <button
        type="button"
        onClick={() => (backTo ? router.push(backTo) : router.back())}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M12.5 15.5 7 10l5.5-5.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {backLabel}
      </button>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-1 text-[15px] text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
