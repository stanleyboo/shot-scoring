'use client';

import { useState, useTransition } from 'react';
import { deleteStatType, renameStatType, toggleStatType } from '@/actions/stat-types';
import ConfirmModal from './ConfirmModal';
import type { StatType } from '@/lib/db';

export default function StatTypeList({ statTypes }: { statTypes: StatType[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  function startEditing(st: StatType) {
    setEditingId(st.id);
    setEditName(st.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
  }

  function handleRename(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!editName.trim()) return;
    startTransition(async () => {
      try {
        await renameStatType(id, editName);
        setEditingId(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to rename');
      }
    });
  }

  function handleToggle(id: number) {
    startTransition(async () => {
      try {
        await toggleStatType(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to toggle');
      }
    });
  }

  if (statTypes.length === 0) {
    return (
      <p className="py-10 text-center text-[var(--text-dim)]">
        No stat types yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {statTypes.map(st => (
        <li key={st.id} className="flex items-center justify-between py-3 gap-3">
          {editingId === st.id ? (
            <form onSubmit={e => handleRename(e, st.id)} className="flex flex-1 items-center gap-2">
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={50}
                className="flex-1 bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-3 py-1.5 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={isPending || !editName.trim()}
                className="bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-3 py-1.5 text-sm hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isPending}
                className="rounded px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-medium truncate ${st.enabled ? 'text-[var(--text)]' : 'text-[var(--text-dim)] line-through'}`}>
                {st.name}
              </span>
              {!st.enabled && (
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">disabled</span>
              )}
            </div>
          )}

          {editingId !== st.id && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => handleToggle(st.id)}
                disabled={isPending}
                className={`relative h-6 w-10 rounded-full transition-colors flex-shrink-0 ${
                  st.enabled ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'
                } disabled:opacity-50`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--bg)] shadow transition-transform ${
                  st.enabled ? 'left-[18px]' : 'left-0.5'
                }`} />
              </button>
              <button
                onClick={() => startEditing(st)}
                disabled={isPending}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => setDeleteTarget({ id: st.id, name: st.name })}
                disabled={isPending}
                className="text-sm text-[var(--text-dim)] hover:text-[var(--red)] disabled:opacity-40 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Stat Type"
        message={`Delete "${deleteTarget?.name ?? ''}"? All recorded events of this type will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id } = deleteTarget;
          setDeleteTarget(null);
          startTransition(async () => {
            try {
              await deleteStatType(id);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to delete');
            }
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ul>
  );
}
