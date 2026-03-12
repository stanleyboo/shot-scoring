'use client';

import { useState, useTransition } from 'react';
import { createPlayer } from '@/actions/players';
import { useToast } from './ToastProvider';
import type { Team } from '@/lib/db';

export default function AddPlayerForm({ teams }: { teams: Team[] }) {
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id?.toString() ?? '');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !teamId) return;
    setError('');
    startTransition(async () => {
      try {
        await createPlayer(name, Number(teamId));
        setName('');
        toast('Player added');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add player');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_220px_auto]">
        <input
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Player name..."
          className="flex-1 bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          disabled={isPending}
          maxLength={50}
        />
        <select
          value={teamId}
          onChange={event => setTeamId(event.target.value)}
          className="bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          disabled={isPending}
        >
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || !name.trim() || !teamId}
          className="bg-yellow-400 text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-wide"
        >
          {isPending ? '...' : 'Add Player'}
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
