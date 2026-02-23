'use client';

import { useState, useTransition } from 'react';
import { createPlayer } from '@/actions/players';

export default function AddPlayerForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        await createPlayer(name);
        setName('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add player');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Player name..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          disabled={isPending}
          maxLength={50}
        />
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
