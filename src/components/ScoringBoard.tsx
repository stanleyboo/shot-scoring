'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordShot, undoLastShot } from '@/actions/shots';
import { endSession } from '@/actions/sessions';
import PlayerScoreCard from './PlayerScoreCard';
import type { Session, SessionWithStats } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

interface Props {
  session: Session;
  players: PlayerStats[];
}

export default function ScoringBoard({ session, players }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticPlayers, addOptimistic] = useOptimistic(
    players,
    (state: PlayerStats[], { playerId, scored }: { playerId: number; scored: boolean }) =>
      state.map(p =>
        p.player_id === playerId
          ? { ...p, made: p.made + (scored ? 1 : 0), attempted: p.attempted + 1 }
          : p
      )
  );

  function handleShot(playerId: number, scored: boolean) {
    startTransition(async () => {
      addOptimistic({ playerId, scored });
      await recordShot(session.id, playerId, scored);
    });
  }

  function handleUndo(playerId: number) {
    startTransition(async () => {
      await undoLastShot(session.id, playerId);
      router.refresh();
    });
  }

  function handleEnd() {
    if (!confirm('End this session?')) return;
    startTransition(async () => {
      await endSession(session.id);
      router.push(`/sessions/${session.id}/summary`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            {session.name ?? 'Training Session'}
          </h1>
          <p className="text-sm text-slate-500">
            {new Date(session.started_at).toLocaleString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={handleEnd}
          disabled={isPending}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Player cards */}
      <div className="space-y-3">
        {optimisticPlayers.map(player => (
          <PlayerScoreCard
            key={player.player_id}
            player={player}
            onShot={handleShot}
            onUndo={handleUndo}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}
