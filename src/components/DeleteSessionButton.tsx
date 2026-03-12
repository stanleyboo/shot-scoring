'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSession } from '@/actions/sessions';

interface Props {
  sessionId: number;
  redirectTo?: string;
}

export default function DeleteSessionButton({ sessionId, redirectTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('Delete this session and all its shots? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteSession(sessionId);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Delete session"
      className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      {isPending ? '...' : 'Delete'}
    </button>
  );
}
