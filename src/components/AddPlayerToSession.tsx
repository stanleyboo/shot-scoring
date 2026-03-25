'use client';

import { useState, useTransition } from 'react';
import { addPlayerToSession } from '@/actions/sessions';
import type { Player } from '@/lib/db';

interface Props {
  sessionId: number;
  availablePlayers: Player[];
}

export default function AddPlayerToSession({ sessionId, availablePlayers }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  if (availablePlayers.length === 0) return null;

  const filtered = search
    ? availablePlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : availablePlayers;

  function handleAdd(playerId: number) {
    startTransition(async () => {
      await addPlayerToSession(sessionId, playerId);
      setSearch('');
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
      >
        + Add Player
      </button>
    );
  }

  return (
    <div className="rounded border border-[var(--border)] bg-white/20 backdrop-blur-sm p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--text)] font-[family-name:var(--font-display)]">
          Add Player
        </h3>
        <button
          onClick={() => { setOpen(false); setSearch(''); }}
          className="text-[var(--text-dim)] hover:text-[var(--text)] text-lg leading-none"
        >
          &times;
        </button>
      </div>
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-white/15 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--gold)]"
      />
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-[var(--text-dim)] py-2">No players found</p>
        ) : (
          filtered.map(p => (
            <button
              key={p.id}
              onClick={() => handleAdd(p.id)}
              disabled={isPending}
              className="w-full text-left rounded px-3 py-2 text-sm text-[var(--text)] hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-between"
            >
              <span>{p.name}</span>
              <span className="text-xs text-[var(--text-dim)]">+</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
