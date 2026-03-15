'use client';

import { useState, useTransition } from 'react';
import { removePlayerFromSession } from '@/actions/sessions';
import ConfirmModal from './ConfirmModal';

interface Props {
  sessionId: number;
  playerId: number;
  playerName: string;
}

export default function RemovePlayerButton({ sessionId, playerId, playerName }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setShowModal(false);
    startTransition(async () => {
      try {
        await removePlayerFromSession(sessionId, playerId);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove player');
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50 text-xs"
        title={`Remove ${playerName}`}
      >
        ✕
      </button>
      <ConfirmModal
        open={showModal}
        title="Remove Player"
        message={`Remove ${playerName} from this match? Their shots and stats for this match will be deleted.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
