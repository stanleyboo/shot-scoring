'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await login(password);
      if (result.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(result.error ?? 'Login failed');
        setPassword('');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--red)]">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending || !password}
        className="w-full bg-[var(--gold)] text-[var(--bg)] font-bold rounded py-3 hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
      >
        {isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
