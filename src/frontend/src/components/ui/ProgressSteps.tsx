import { cn } from './cn';

export type StepState = 'pending' | 'active' | 'done' | 'failed';
export interface Step { key: string; label: string; state: StepState }

/** Live processing pipeline indicator used by the policy upload screen. */
export function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2.5" aria-live="polite">
      {steps.map((s) => (
        <li key={s.key} className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
              s.state === 'done' && 'border-positive bg-positive text-white',
              s.state === 'active' && 'border-brand bg-brand text-white',
              s.state === 'pending' && 'border-line bg-white text-ink-subtle',
              s.state === 'failed' && 'border-danger bg-danger text-white',
            )}
            aria-hidden="true"
          >
            {s.state === 'done' ? '✓' : s.state === 'failed' ? '!' : s.state === 'active' ? (
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : '·'}
          </span>
          <span
            className={cn(
              'text-sm',
              s.state === 'pending' ? 'text-ink-subtle' : 'font-medium text-ink',
              s.state === 'failed' && 'text-danger',
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
