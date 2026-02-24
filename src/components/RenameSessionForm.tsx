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
        <h1 className="text-2xl font-bold text-slate-100">
          {currentName ?? 'Training Session'}
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded"
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
        className="rounded-lg border border-indigo-500 bg-slate-800 px-3 py-1.5 text-lg font-bold text-slate-100 placeholder-slate-500 focus:outline-none"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        Save
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
