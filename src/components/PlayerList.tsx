'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deletePlayer, movePlayerTeam, renamePlayer } from '@/actions/players';
import type { Player, Team } from '@/lib/db';

type PlayerWithShots = Player & { total_shots: number };

export default function PlayerList({
  players,
  teams,
  canEdit = true,
}: {
  players: PlayerWithShots[];
  teams: Team[];
  canEdit?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  function startEditing(player: PlayerWithShots) {
    setEditingId(player.id);
    setEditName(player.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
  }

  function handleRename(event: React.FormEvent, playerId: number) {
    event.preventDefault();
    if (!editName.trim()) return;
    startTransition(async () => {
      try {
        await renamePlayer(playerId, editName);
        setEditingId(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to rename');
      }
    });
  }

  function handleMove(playerId: number, teamId: string) {
    startTransition(async () => {
      try {
        await movePlayerTeam(playerId, Number(teamId));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to move player');
      }
    });
  }

  function handleDelete(id: number, name: string, shotCount: number) {
    const message = shotCount > 0
      ? `Delete ${name}? This will remove all their shot history across all sessions.`
      : `Remove ${name}?`;
    if (!confirm(message)) return;
    startTransition(async () => {
      try {
        await deletePlayer(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete');
      }
    });
  }

  if (players.length === 0) {
    return (
      <p className="border border-stone-800 bg-[#111] rounded-lg px-6 py-8 text-center text-sm uppercase tracking-[0.18em] text-stone-500">
        No players yet.
      </p>
    );
  }

  return (
    <ul className="border border-stone-800 bg-[#111] rounded-lg overflow-hidden">
      {players.map(player => (
        <li key={player.id} className="border-t border-stone-800 first:border-t-0">
          <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            {editingId === player.id ? (
              <form onSubmit={event => handleRename(event, player.id)} className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={event => setEditName(event.target.value)}
                  maxLength={50}
                  className="flex-1 bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !editName.trim()}
                  className="bg-yellow-400 text-black font-bold rounded-lg px-3 py-2 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isPending}
                  className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-3 py-2 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-lg font-bold text-white">{player.name}</span>
                  {player.total_shots > 0 && (
                    <span className="bg-stone-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-stone-300">
                      {player.total_shots} shots
                    </span>
                  )}
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Team
                    </label>
                    <select
                      value={player.team_id}
                      onChange={event => handleMove(player.id, event.target.value)}
                      disabled={isPending}
                      className="bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-sm text-yellow-300 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  player.team_name && (
                    <span className="w-fit bg-yellow-400 px-2 py-1 text-xs font-black uppercase tracking-wide text-black">
                      {player.team_name}
                    </span>
                  )
                )}
              </div>
            )}

            {editingId !== player.id && (
              <div className="flex items-center gap-3 lg:flex-shrink-0">
                <Link
                  href={`/players/${player.id}`}
                  className="bg-yellow-400 px-3 py-2 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300"
                >
                  Stats
                </Link>
                {canEdit && (
                  <>
                    <button
                      onClick={() => startEditing(player)}
                      disabled={isPending}
                      className="border border-stone-800 rounded-lg px-3 py-2 text-sm uppercase tracking-wide text-stone-200 transition hover:border-yellow-400 hover:text-yellow-300 disabled:opacity-40"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(player.id, player.name, player.total_shots)}
                      disabled={isPending}
                      className="border border-stone-800 rounded-lg px-3 py-2 text-sm uppercase tracking-wide text-stone-400 transition hover:border-red-500 hover:text-red-400 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
