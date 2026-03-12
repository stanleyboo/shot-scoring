'use client';

import { useState, useTransition } from 'react';
import { createTeam } from '@/actions/teams';

export default function AddTeamForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        await createTeam(name);
        setName('');
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
          className="flex-1 bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          disabled={isPending}
          maxLength={60}
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="bg-yellow-400 text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {isPending ? '...' : 'Add Team'}
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
