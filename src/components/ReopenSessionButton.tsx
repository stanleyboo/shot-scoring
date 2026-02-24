'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reopenSession } from '@/actions/sessions';

export default function ReopenSessionButton({ sessionId }: { sessionId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReopen() {
    startTransition(async () => {
      await reopenSession(sessionId);
      router.push(`/sessions/${sessionId}`);
    });
  }

  return (
    <button
      onClick={handleReopen}
      disabled={isPending}
      className="flex-1 rounded-xl border border-slate-600 py-3 text-center text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Opening...' : 'Edit Shots'}
    </button>
  );
}
