'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deletePlayer, renamePlayer } from '@/actions/players';
import type { Player } from '@/lib/db';

type PlayerWithShots = Player & { total_shots: number };

export default function PlayerList({ players }: { players: PlayerWithShots[] }) {
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

  function handleRename(e: React.FormEvent, playerId: number) {
    e.preventDefault();
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

  function handleDelete(id: number, name: string, shotCount: number) {
    const msg = shotCount > 0
      ? `Delete ${name}? This will remove all their shot history across all sessions.`
      : `Remove ${name}?`;
    if (!confirm(msg)) return;
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
      <p className="py-10 text-center text-slate-500">
        No players yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-800">
      {players.map(p => (
        <li key={p.id} className="flex items-center justify-between py-3 gap-3">
          {editingId === p.id ? (
            <form onSubmit={e => handleRename(e, p.id)} className="flex flex-1 items-center gap-2">
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={50}
                className="flex-1 rounded-lg border border-indigo-500 bg-slate-800 px-3 py-1.5 text-slate-100 focus:outline-none"
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={isPending || !editName.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <span className="font-medium text-slate-100 truncate">{p.name}</span>
              {p.total_shots > 0 && (
                <span className="flex-shrink-0 text-sm text-slate-500">
                  {p.total_shots} shots
                </span>
              )}
            </div>
          )}

          {editingId !== p.id && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href={`/players/${p.id}`}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Stats
              </Link>
              <button
                onClick={() => startEditing(p)}
                disabled={isPending}
                className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => handleDelete(p.id, p.name, p.total_shots)}
                disabled={isPending}
                className="text-sm text-slate-600 hover:text-red-400 disabled:opacity-40 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
