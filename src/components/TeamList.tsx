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
            className="border border-[var(--border)] bg-[var(--surface)] rounded px-4 py-4 gold-accent"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {editingId === team.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={event => setName(event.target.value)}
                      className="min-w-[220px] flex-1 bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
                      disabled={isPending}
                    />
                    <button
                      onClick={() => handleRename(team.id)}
                      disabled={isPending || !name.trim()}
                      className="bg-[var(--gold)] text-black font-bold rounded px-3 py-2 text-sm hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isPending}
                      className="border border-[var(--border)] bg-transparent rounded px-3 py-2 text-sm font-black uppercase tracking-wide text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">{team.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {team.player_count} players, {team.session_count} matches
                    </p>
                  </>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {team.wins}-{team.draws}-{team.losses}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {percentage === null ? 'No shooting data yet' : `${percentage}% accuracy`}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/teams/${team.id}`}
                className="bg-[var(--gold)] rounded border border-[var(--gold)] px-3 py-2 text-sm font-black uppercase tracking-wide text-black hover:bg-[var(--gold-hover)]"
              >
                Open Team
              </Link>
              {editingId !== team.id && (
                <>
                  <button
                    onClick={() => startEditing(team)}
                    disabled={isPending}
                    className="border border-[var(--border)] rounded px-3 py-2 text-sm font-black uppercase tracking-wide text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setDeletingId(team.id)}
                    disabled={isPending}
                    className="border border-[var(--red)]/30 rounded px-3 py-2 text-sm font-black uppercase tracking-wide text-[var(--red)] hover:border-[var(--red)] hover:text-[var(--red-hover)] transition-all"
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
