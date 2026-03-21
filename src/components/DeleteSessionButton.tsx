'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSession } from '@/actions/sessions';
import ConfirmModal from './ConfirmModal';

interface Props {
  sessionId: number;
  redirectTo?: string;
}

export default function DeleteSessionButton({ sessionId, redirectTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function handleDelete() {
    setShowModal(true);
  }

  function confirmDelete() {
    setShowModal(false);
    startTransition(async () => {
      await deleteSession(sessionId);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete session"
        className="rounded px-3 py-1.5 text-sm text-[var(--text-dim)] hover:bg-[var(--red)]/10 hover:text-[var(--red)] disabled:opacity-40 transition-colors"
      >
        {isPending ? '...' : 'Delete'}
      </button>
      <ConfirmModal
        open={showModal}
        title="Delete Session"
        message="Delete this session and all its shots? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
