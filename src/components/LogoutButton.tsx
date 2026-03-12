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
      className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-3 py-1.5 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
    >
      Logout
    </button>
  );
}
