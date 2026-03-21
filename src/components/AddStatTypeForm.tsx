'use client';

import { useState, useTransition } from 'react';
import { createStatType } from '@/actions/stat-types';
import { useToast } from './ToastProvider';

export default function AddStatTypeForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        await createStatType(name);
        setName('');
        toast('Stat type added');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add stat type');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Stat type name..."
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
          disabled={isPending}
          maxLength={50}
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="bg-[var(--gold)] text-black font-bold rounded px-5 py-3 hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {isPending ? '...' : 'Add'}
        </button>
      </div>
      {error && <p className="text-[var(--red)] text-sm">{error}</p>}
    </form>
  );
}
