'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/actions/sessions';
import type { Player } from '@/lib/db';

export default function NewSessionForm({ players }: { players: Player[] }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function togglePlayer(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError('Select at least one player');
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        const session = await createSession(name, Array.from(selected));
        router.push(`/sessions/${session.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start session');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">
          Session name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Tuesday Training"
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          disabled={isPending}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">
          Players ({selected.size} selected)
        </p>
        {players.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 text-center">
            <p className="text-slate-400 mb-2">No players yet.</p>
            <a href="/players" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Add players first →
            </a>
          </div>
        ) : (
          <div className="grid gap-2">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  selected.has(player.id)
                    ? 'border-indigo-500 bg-indigo-950/50 text-slate-100'
                    : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                    selected.has(player.id)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selected.has(player.id) && (
                    <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="font-medium">{player.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending || selected.size === 0 || players.length === 0}
        className="w-full rounded-2xl bg-indigo-600 py-4 text-xl font-bold text-white hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isPending ? 'Starting...' : 'Start Session'}
      </button>
    </form>
  );
}
