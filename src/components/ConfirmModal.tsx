'use client';

import { useEffect, useRef } from 'react';

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
      ? 'bg-red-600 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-red-500 active:scale-[0.98] transition-all'
      : 'bg-yellow-400 text-black font-bold rounded-lg px-5 py-2.5 hover:bg-yellow-300 active:scale-[0.98] transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-lg border border-stone-800 bg-[#111] p-6 space-y-4">
        <h3 className="text-lg font-bold text-stone-50">{title}</h3>
        <p className="text-sm text-stone-400">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-5 py-2.5 hover:border-yellow-500 hover:text-yellow-300 transition-all"
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
    </div>
  );
}
