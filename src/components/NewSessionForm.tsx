'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/actions/sessions';
import type { Player, Team } from '@/lib/db';

export default function NewSessionForm({
  players,
  teams,
}: {
  players: Player[];
  teams: Team[];
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [teamId, setTeamId] = useState(teams[0]?.id.toString() ?? '');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const teamPlayers = useMemo(
    () => players.filter(player => player.team_id === Number(teamId)),
    [players, teamId]
  );

  function togglePlayer(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleTeamChange(nextTeamId: string) {
    setTeamId(nextTeamId);
    setSelected(new Set());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!teamId) {
      setError('Choose a team');
      return;
    }
    if (selected.size === 0) {
      setError('Select at least one player');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const session = await createSession(name, Array.from(selected), Number(teamId));
        router.push(`/sessions/${session.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start match');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-300">Team</label>
          <select
            value={teamId}
            onChange={event => handleTeamChange(event.target.value)}
            className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
            disabled={isPending}
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-300">Match name</label>
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. Wednesday v Halifax"
            className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-300">
          Players ({selected.size} selected)
        </p>
        {teamPlayers.length === 0 ? (
          <div className="border-2 border-stone-900 bg-black p-6 text-center">
            <p className="mb-2 text-stone-400">No players in this team yet.</p>
            <a href="/players" className="text-sm text-yellow-300 hover:text-yellow-200">
              Add players first →
            </a>
          </div>
        ) : (
          <div className="grid gap-2">
            {teamPlayers.map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={`flex items-center gap-3 border rounded-lg px-4 py-3.5 text-left transition ${
                  selected.has(player.id)
                    ? 'border-yellow-400 bg-[#222000] text-white'
                    : 'border-stone-900 bg-[#111111] text-stone-200 hover:border-yellow-400'
                }`}
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                    selected.has(player.id)
                      ? 'border-yellow-400 bg-yellow-400'
                      : 'border-stone-600'
                  }`}
                >
                  {selected.has(player.id) && (
                    <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{player.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending || selected.size === 0 || teamPlayers.length === 0}
        className="w-full bg-yellow-400 text-black font-bold rounded-lg py-4 text-xl hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        {isPending ? 'Starting...' : 'Start Match'}
      </button>
    </form>
  );
}
