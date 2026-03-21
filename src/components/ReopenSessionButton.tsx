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
      className="flex-1 border border-[var(--border)] bg-transparent text-[var(--text-muted)] rounded py-3 text-center hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-50 transition-all"
    >
      {isPending ? 'Opening...' : 'Edit Shots'}
    </button>
  );
}
