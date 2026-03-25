'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-[var(--red)] text-[var(--text)] font-bold rounded px-5 py-2.5 hover:bg-[var(--red-hover)] active:scale-[0.98] transition-all'
      : 'bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-5 py-2.5 hover:bg-[var(--gold-hover)] active:scale-[0.98] transition-all';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-white/25 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded border border-[var(--border)] bg-white/25 backdrop-blur-sm p-6 space-y-4 gold-accent">
        <h3 className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase tracking-wide">{title}</h3>
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="border border-[var(--border)] bg-transparent text-[var(--text-muted)] rounded px-5 py-2.5 hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={confirmClasses}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
