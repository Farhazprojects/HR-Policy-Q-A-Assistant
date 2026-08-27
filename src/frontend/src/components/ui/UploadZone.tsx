'use client';
import { useCallback, useRef, useState, type DragEvent } from 'react';
import { cn } from './cn';
import { Button } from './Button';

export function UploadZone({
  onFile, disabled, accept = 'application/pdf', maxMb = 20,
}: { onFile: (f: File) => void; disabled?: boolean; accept?: string; maxMb?: number }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File): boolean => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF policy documents can be uploaded.');
        return false;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${maxMb} MB.`);
        return false;
      }
      if (file.size === 0) {
        setError('That file is empty.');
        return false;
      }
      setError(null);
      return true;
    },
    [maxMb],
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && validate(file)) onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-brand bg-brand-wash' : 'border-line bg-canvas',
          disabled && 'opacity-60',
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-brand shadow-card">
          ⬆
        </div>
        <p className="text-base font-semibold text-ink">Drag and drop PDF here</p>
        <p className="mt-1 text-sm text-ink-muted">or choose a file from your computer</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && validate(file)) onFile(file);
            e.target.value = '';
          }}
        />
        <Button className="mt-5" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Choose PDF
        </Button>
        <p className="mt-3 text-xs text-ink-subtle">PDF only • up to {maxMb} MB</p>
      </div>
      {error ? <p className="mt-2 text-sm text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
