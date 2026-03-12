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
      className="flex-1 border border-stone-800 bg-transparent text-stone-300 rounded-lg py-3 text-center hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
    >
      {isPending ? 'Opening...' : 'Edit Shots'}
    </button>
  );
}
