'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

export function Modal({
  open, onClose, title, description, children, footer,
}: {
  open: boolean; onClose: () => void; title: string;
  description?: string; children?: ReactNode; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg animate-slide-up rounded-card bg-white shadow-modal"
      >
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {children ? <div className="max-h-[60vh] overflow-y-auto p-5">{children}</div> : null}
        <div className="flex justify-end gap-2 border-t border-line p-4">
          {footer ?? <Button variant="secondary" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmLabel?: string; loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
