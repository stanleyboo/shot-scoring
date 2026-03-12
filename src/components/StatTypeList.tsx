'use client';

import { useState, useTransition } from 'react';
import { deleteStatType, renameStatType } from '@/actions/stat-types';
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

  function handleDelete(id: number, name: string) {
    setDeleteTarget({ id, name });
  }

  function confirmDelete() {
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
  }

  if (statTypes.length === 0) {
    return (
      <p className="py-10 text-center text-stone-500">
        No stat types yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-800">
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
                className="flex-1 bg-[#111] border border-stone-800 rounded-lg px-3 py-1.5 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={isPending || !editName.trim()}
                className="bg-yellow-400 text-black font-bold rounded-lg px-3 py-1.5 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <span className="font-medium text-stone-50 truncate">{st.name}</span>
          )}

          {editingId !== st.id && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => startEditing(st)}
                disabled={isPending}
                className="text-sm text-stone-400 hover:text-stone-300 disabled:opacity-40 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => handleDelete(st.id, st.name)}
                disabled={isPending}
                className="text-sm text-stone-600 hover:text-red-400 disabled:opacity-40 transition-colors"
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
        message={`Delete "${deleteTarget?.name ?? ''}"? This will remove all recorded events of this type.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ul>
  );
}
