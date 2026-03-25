'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deletePlayer, movePlayerTeam, renamePlayer } from '@/actions/players';
import ConfirmModal from './ConfirmModal';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; shotCount: number } | null>(null);

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
    setDeleteTarget({ id, name, shotCount });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
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
      <p className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded px-6 py-8 text-center text-sm uppercase tracking-[0.18em] text-[var(--text-dim)]">
        No players yet.
      </p>
    );
  }

  return (
    <ul className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded overflow-hidden">
      {players.map(player => (
        <li key={player.id} className="border-t border-[var(--border)] first:border-t-0">
          <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            {editingId === player.id ? (
              <form onSubmit={event => handleRename(event, player.id)} className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={event => setEditName(event.target.value)}
                  maxLength={50}
                  className="flex-1 bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !editName.trim()}
                  className="bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-3 py-2 text-sm hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isPending}
                  className="border border-[var(--border)] bg-transparent text-[var(--text-muted)] rounded px-3 py-2 text-sm hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-lg font-bold text-[var(--text)]">{player.name}</span>
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      Team
                    </label>
                    <select
                      value={player.team_id}
                      onChange={event => handleMove(player.id, event.target.value)}
                      disabled={isPending}
                      className="bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--gold)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
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
                    <span className="w-fit bg-[var(--gold)] px-2 py-1 text-xs font-black uppercase tracking-wide text-[var(--bg)]">
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
                  className="bg-[var(--gold)] px-3 py-2 text-sm font-black uppercase tracking-wide text-[var(--bg)] transition hover:bg-[var(--gold-hover)]"
                >
                  Stats
                </Link>
                {canEdit && (
                  <>
                    <button
                      onClick={() => startEditing(player)}
                      disabled={isPending}
                      className="border border-[var(--border)] rounded px-3 py-2 text-sm uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-40"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(player.id, player.name, player.total_shots)}
                      disabled={isPending}
                      className="border border-[var(--border)] rounded px-3 py-2 text-sm uppercase tracking-wide text-[var(--text-dim)] transition hover:border-[var(--red)] hover:text-[var(--red)] disabled:opacity-40"
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
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Player"
        message={`Delete ${deleteTarget?.name ?? ''}? You can restore them from the Admin panel.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ul>
  );
}
