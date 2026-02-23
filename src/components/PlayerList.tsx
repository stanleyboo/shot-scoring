'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { deletePlayer } from '@/actions/players';
import type { Player } from '@/lib/db';

type PlayerWithShots = Player & { total_shots: number };

export default function PlayerList({ players }: { players: PlayerWithShots[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
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
        <li key={p.id} className="flex items-center justify-between py-3">
          <div>
            <span className="font-medium text-slate-100">{p.name}</span>
            {p.total_shots > 0 && (
              <span className="ml-2 text-sm text-slate-500">
                {p.total_shots} shots
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/players/${p.id}`}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Stats
            </Link>
            <button
              onClick={() => handleDelete(p.id, p.name)}
              disabled={isPending || p.total_shots > 0}
              title={
                p.total_shots > 0
                  ? 'Cannot delete — player has shot history'
                  : 'Delete player'
              }
              className="text-sm text-slate-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
