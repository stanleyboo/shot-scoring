'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => {
        await logout();
        router.push('/');
        router.refresh();
      })}
      disabled={isPending}
      className="border border-[var(--border)] bg-transparent text-[var(--text-muted)] rounded px-3 py-1.5 text-sm hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-50 transition-all"
    >
      Logout
    </button>
  );
}
