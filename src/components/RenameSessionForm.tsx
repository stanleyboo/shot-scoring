'use client';

import { useState, useTransition } from 'react';
import { renameSession } from '@/actions/sessions';

interface Props {
  sessionId: number;
  currentName: string | null;
}

export default function RenameSessionForm({ sessionId, currentName }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await renameSession(sessionId, value);
      setEditing(false);
    });
  }

  function handleCancel() {
    setValue(currentName ?? '');
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase tracking-wide">
          {currentName ?? 'Training Session'}
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors px-2 py-1 rounded"
        >
          Rename
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Session name..."
        maxLength={100}
        className="bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-3 py-1.5 text-lg font-bold text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-3 py-1.5 text-sm hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
      >
        Save
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="rounded px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
