'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { renameTeam, deleteTeam } from '@/actions/teams';
import ConfirmModal from './ConfirmModal';
import type { TeamSummary } from '@/lib/db';

export default function TeamList({ teams }: { teams: TeamSummary[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  if (teams.length === 0) return null;

  function startEditing(team: TeamSummary) {
    setEditingId(team.id);
    setName(team.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setName('');
  }

  function handleRename(teamId: number) {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await renameTeam(teamId, name);
        cancelEditing();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to rename team');
      }
    });
  }

  return (
    <div className="space-y-3">
      {teams.map(team => {
        const percentage = team.total_attempts > 0
          ? Math.round((team.total_goals / team.total_attempts) * 100)
          : null;

        return (
          <div
            key={team.id}
            className="border border-stone-800 bg-[#111] rounded-lg px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {editingId === team.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={event => setName(event.target.value)}
                      className="min-w-[220px] flex-1 bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                      disabled={isPending}
                    />
                    <button
                      onClick={() => handleRename(team.id)}
                      disabled={isPending || !name.trim()}
                      className="bg-yellow-400 text-black font-bold rounded-lg px-3 py-2 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isPending}
                      className="border border-stone-800 bg-transparent rounded-lg px-3 py-2 text-sm font-black uppercase tracking-wide text-stone-300 hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-black text-yellow-300">{team.name}</p>
                    <p className="text-sm text-stone-400">
                      {team.player_count} players, {team.session_count} matches
                    </p>
                  </>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {team.wins}-{team.draws}-{team.losses}
                </p>
                <p className="text-xs text-stone-400">
                  {percentage === null ? 'No shooting data yet' : `${percentage}% accuracy`}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/teams/${team.id}`}
                className="bg-yellow-400 rounded-lg border border-yellow-400 px-3 py-2 text-sm font-black uppercase tracking-wide text-black hover:bg-yellow-300"
              >
                Open Team
              </Link>
              {editingId !== team.id && (
                <>
                  <button
                    onClick={() => startEditing(team)}
                    disabled={isPending}
                    className="border border-stone-800 rounded-lg px-3 py-2 text-sm font-black uppercase tracking-wide text-stone-300 hover:border-yellow-400 hover:text-yellow-300"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setDeletingId(team.id)}
                    disabled={isPending}
                    className="border border-red-900/50 rounded-lg px-3 py-2 text-sm font-black uppercase tracking-wide text-red-400 hover:border-red-500 hover:text-red-300 transition-all"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      <ConfirmModal
        open={deletingId !== null}
        title="Delete Team"
        message="Delete this team? All players and match history associated with this team will be removed."
        confirmLabel="Delete Team"
        variant="danger"
        onConfirm={() => {
          if (deletingId === null) return;
          const id = deletingId;
          setDeletingId(null);
          startTransition(async () => {
            try {
              await deleteTeam(id);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to delete team');
            }
          });
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
