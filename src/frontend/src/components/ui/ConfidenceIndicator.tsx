import { cn } from './cn';

const bands = {
  HIGH: { text: 'text-positive', bar: 'bg-positive', label: 'High' },
  MEDIUM: { text: 'text-caution', bar: 'bg-caution', label: 'Medium' },
  LOW: { text: 'text-danger', bar: 'bg-danger', label: 'Low' },
} as const;

/**
 * Displays the retrieval-derived confidence. The figure is calculated by the
 * backend from similarity evidence — it is never produced by the language model.
 */
export function ConfidenceIndicator({
  percentage, band, compact = false,
}: { percentage: number; band: 'HIGH' | 'MEDIUM' | 'LOW'; compact?: boolean }) {
  const b = bands[band];

  if (compact) {
    return (
      <span className={cn('text-sm font-semibold', b.text)}>
        {percentage}% <span className="font-normal text-ink-muted">({b.label})</span>
      </span>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-4xl font-semibold tracking-tight', b.text)}>{percentage}%</span>
        <span className="text-sm font-medium text-ink-muted">{b.label} confidence</span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line" role="img"
           aria-label={`Retrieval confidence ${percentage} percent, ${b.label}`}>
        <div className={cn('h-full rounded-full transition-all duration-700', b.bar)}
             style={{ width: `${Math.max(2, percentage)}%` }} />
      </div>
    </div>
  );
}
