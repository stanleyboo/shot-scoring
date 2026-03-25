'use client';

import { useState, useTransition } from 'react';
import { createTeam } from '@/actions/teams';
import { useToast } from './ToastProvider';

export default function AddTeamForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        await createTeam(name);
        setName('');
        toast('Team created');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create team');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Add a squad or team name"
          className="flex-1 bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
          disabled={isPending}
          maxLength={60}
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-5 py-3 hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {isPending ? '...' : 'Add Team'}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
    </form>
  );
}
