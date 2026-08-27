'use client';
import { cn } from './cn';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

const base =
  'w-full rounded-lg border bg-white px-3.5 text-sm text-ink transition-colors placeholder:text-ink-subtle ' +
  'focus:border-brand disabled:cursor-not-allowed disabled:bg-canvas';

function Field({
  label, hint, error, children, htmlFor, required,
}: {
  label?: string; hint?: string; error?: string; children: ReactNode; htmlFor: string; required?: boolean;
}) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required ? <span className="ml-0.5 text-danger" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string;
}

export function Input({ label, hint, error, className, id, required, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        required={required}
        className={cn(base, 'h-11', error ? 'border-danger' : 'border-line', className)}
        {...rest}
      />
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; hint?: string; error?: string; options: { value: string; label: string }[];
}

export function Select({ label, hint, error, options, className, id, required, ...rest }: SelectProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(base, 'h-11 cursor-pointer appearance-none pr-9', error ? 'border-danger' : 'border-line', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%235B6478' d='M1.4 0 6 4.6 10.6 0 12 1.4 6 7.4 0 1.4z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; hint?: string; error?: string;
}

export function Textarea({ label, hint, error, className, id, required, ...rest }: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(base, 'min-h-[96px] resize-y py-2.5', error ? 'border-danger' : 'border-line', className)}
        {...rest}
      />
    </Field>
  );
}
