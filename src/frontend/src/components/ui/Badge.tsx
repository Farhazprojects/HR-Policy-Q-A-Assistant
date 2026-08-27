import { cn } from './cn';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'positive' | 'caution' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-muted border-line',
  brand: 'bg-brand-wash text-brand-dark border-brand-200',
  positive: 'bg-positive-wash text-positive border-positive/25',
  caution: 'bg-caution-wash text-caution border-caution/25',
  danger: 'bg-danger-wash text-danger border-danger/25',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Marks seeded demonstration data, as required for academic honesty. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="caution" className={className} title="Seeded demonstration data, not live organisational data">
      DEMO DATA
    </Badge>
  );
}

/** Marks features the Figma prototype itself labels as placeholders. */
export function PrototypeBadge({ className }: { className?: string }) {
  return (
    <Badge tone="neutral" className={className} title="Prototype placeholder — not implemented in this capstone stage">
      PROTOTYPE
    </Badge>
  );
}
