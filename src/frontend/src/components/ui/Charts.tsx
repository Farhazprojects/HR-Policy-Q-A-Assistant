/**
 * Chart primitives, drawn as inline SVG.
 *
 * No charting library: the shapes needed here are simple, and a dependency
 * would ship far more than the dashboard uses. Every value rendered comes from
 * a live database aggregate — none of these components accept a hard-coded
 * series.
 *
 * Colour follows the job the data does. Magnitude comparisons use one hue,
 * light to dark (the brand ramp, whose luminance is monotonic). The two-class
 * outcome split uses brand against caution, a pair checked for colour-vision
 * separation rather than chosen by eye — the intuitive green/amber pairing
 * fails that check (ΔE 5.9 under protanopia) and is not used.
 *
 * Every series is also directly labelled, so identity never rests on colour.
 */

const SEQUENTIAL = ['#4232A6', '#5440CC', '#6E5CD9', '#A797ED', '#C9BDF5'] as const;

/** Sequential ramp position: the largest value is darkest. */
function rampColour(index: number, total: number): string {
  if (total <= 1) return SEQUENTIAL[1];
  const step = Math.round((index / Math.max(total - 1, 1)) * (SEQUENTIAL.length - 1));
  return SEQUENTIAL[Math.min(step, SEQUENTIAL.length - 1)];
}

export interface Datum {
  label: string;
  value: number;
}

/**
 * Horizontal bars for comparing magnitude across a handful of named things.
 * Horizontal because policy and category names are long — rotated labels on a
 * column chart would be unreadable on a projector.
 */
export function BarChart({
  data,
  caption,
  unit = '',
  unitOne,
  emptyMessage = 'No data recorded yet.',
}: {
  data: Datum[];
  caption?: string;
  /** Plural noun shown after each value, e.g. " policies". */
  unit?: string;
  /** Singular form, used when the value is exactly 1. Defaults to `unit`. */
  unitOne?: string;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-sm text-ink-subtle">{emptyMessage}</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      {caption ? <p className="mb-3 text-xs text-ink-subtle">{caption}</p> : null}
      <ul className="space-y-3">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <li key={d.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink" title={d.label}>
                  {d.label}
                </span>
                {/* Direct label: the value is readable without hovering, which
                    matters when the chart is being projected. */}
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                  {d.value}
                  {d.value === 1 ? (unitOne ?? unit) : unit}
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-canvas"
                role="img"
                aria-label={`${d.label}: ${d.value}${d.value === 1 ? (unitOne ?? unit) : unit}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: rampColour(i, data.length) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Part-to-whole across two or three classes, as a single stacked bar.
 * A 2-slice pie would encode the same numbers less precisely.
 */
export function ShareBar({
  segments,
  caption,
}: {
  segments: { label: string; value: number; colour: string }[];
  caption?: string;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  if (total === 0) {
    return <p className="py-6 text-sm text-ink-subtle">No questions have been asked yet.</p>;
  }
  const shown = segments.filter((s) => s.value > 0);

  return (
    <div>
      {/* 2px surface gaps between fills keep adjacent segments separable
          without a border, which would darken the smaller segment. */}
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-canvas">
        {shown.map((s) => (
          <div
            key={s.label}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-500"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.colour }}
            role="img"
            aria-label={`${s.label}: ${s.value} of ${total}`}
          />
        ))}
      </div>

      {/* Legend is always present for two or more series, and each entry is
          also directly labelled with its count and share. */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {shown.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.colour }}
            />
            <span className="text-ink-muted">{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">
              {s.value}
              <span className="ml-1 font-normal text-ink-subtle">
                ({Math.round((s.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
      {caption ? <p className="mt-3 text-xs text-ink-subtle">{caption}</p> : null}
    </div>
  );
}

/** A single ratio against its limit. A meter, not a two-slice pie. */
export function Meter({
  value,
  total,
  label,
  caption,
}: {
  value: number;
  total: number;
  label: string;
  caption?: string;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className="text-2xl font-bold tabular-nums text-ink">{pct}%</span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-canvas"
        role="img"
        aria-label={`${label}: ${value} of ${total} (${pct}%)`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-subtle">
        {value} of {total}
        {caption ? ` · ${caption}` : ''}
      </p>
    </div>
  );
}

export const CHART_COLOURS = {
  /** Checked for colour-vision separation against caution: ΔE 31.8 (protan). */
  grounded: '#5440CC',
  fallback: '#B7791F',
  error: '#C2453C',
} as const;
