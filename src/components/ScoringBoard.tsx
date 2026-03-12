'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordShot, undoLastShot } from '@/actions/shots';
import { recordStatEvent, undoLastStatEvent } from '@/actions/stats';
import { endSession, updateOppositionScore, togglePlayerOpposition } from '@/actions/sessions';
import PlayerScoreCard from './PlayerScoreCard';
import ConfirmModal from './ConfirmModal';
import type { Session, SessionWithStats, StatType } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

type OptimisticAction =
  | { type: 'shot'; playerId: number; scored: boolean }
  | { type: 'stat'; playerId: number; statTypeId: number; delta: number }
  | { type: 'toggle_opp'; playerId: number };

interface Props {
  session: Session;
  players: PlayerStats[];
  statTypes: StatType[];
}

export default function ScoringBoard({ session, players, statTypes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [oppScoreManual, setOppScoreManual] = useState(session.opposition_score);
  const [oppAttemptedManual, setOppAttemptedManual] = useState(session.opposition_attempted);
  const [showEndModal, setShowEndModal] = useState(false);

  const [optimisticPlayers, addOptimistic] = useOptimistic(
    players,
    (state: PlayerStats[], action: OptimisticAction) =>
      state.map(p => {
        if (p.player_id !== action.playerId) return p;
        if (action.type === 'shot') {
          return {
            ...p,
            made: p.made + (action.scored ? 1 : 0),
            attempted: p.attempted + 1,
          };
        }
        if (action.type === 'toggle_opp') {
          return { ...p, is_opposition: !p.is_opposition };
        }
        return {
          ...p,
          stat_counts: {
            ...p.stat_counts,
            [action.statTypeId]: (p.stat_counts[action.statTypeId] ?? 0) + action.delta,
          },
        };
      })
  );

  const teamScore = optimisticPlayers
    .filter(p => !p.is_opposition)
    .reduce((n, p) => n + p.made, 0);
  const oppShotScore = optimisticPlayers
    .filter(p => p.is_opposition)
    .reduce((n, p) => n + p.made, 0);
  const oppTotal = oppScoreManual + oppShotScore;

  function handleShot(playerId: number, scored: boolean) {
    startTransition(async () => {
      addOptimistic({ type: 'shot', playerId, scored });
      await recordShot(session.id, playerId, scored);
    });
  }

  function handleUndo(playerId: number) {
    startTransition(async () => {
      await undoLastShot(session.id, playerId);
      router.refresh();
    });
  }

  function handleStatEvent(playerId: number, statTypeId: number) {
    startTransition(async () => {
      addOptimistic({ type: 'stat', playerId, statTypeId, delta: 1 });
      await recordStatEvent(session.id, playerId, statTypeId);
    });
  }

  function handleUndoStat(playerId: number, statTypeId: number) {
    startTransition(async () => {
      await undoLastStatEvent(session.id, playerId, statTypeId);
      router.refresh();
    });
  }

  function handleToggleOpposition(playerId: number) {
    startTransition(async () => {
      addOptimistic({ type: 'toggle_opp', playerId });
      await togglePlayerOpposition(session.id, playerId);
    });
  }

  function handleOppScore(delta: number) {
    const nextScore = Math.max(0, oppScoreManual + delta);
    const nextAttempted = delta > 0 ? oppAttemptedManual + 1 : Math.max(0, oppAttemptedManual - 1);
    setOppScoreManual(nextScore);
    setOppAttemptedManual(nextAttempted);
    startTransition(async () => {
      await updateOppositionScore(session.id, nextScore, nextAttempted);
    });
  }

  function handleOppMiss() {
    const nextAttempted = oppAttemptedManual + 1;
    setOppAttemptedManual(nextAttempted);
    startTransition(async () => {
      await updateOppositionScore(session.id, oppScoreManual, nextAttempted);
    });
  }

  function handleEnd() {
    setShowEndModal(true);
  }

  function confirmEnd() {
    setShowEndModal(false);
    startTransition(async () => {
      await endSession(session.id);
      router.push(`/sessions/${session.id}/summary`);
    });
  }

  const homePlayers = optimisticPlayers.filter(p => !p.is_opposition);
  const oppPlayers = optimisticPlayers.filter(p => p.is_opposition);

  return (
    <div className="space-y-4 lg:space-y-2">
      {/* Session header + scoreboard */}
      <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center justify-between gap-2 lg:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-100 truncate sm:text-xl lg:text-base">
              {session.name ?? 'Training Session'}
            </h1>
            <p className="text-xs text-yellow-300 sm:text-sm lg:text-xs">{session.team_name}</p>
            <p className="text-xs text-stone-500 sm:text-sm lg:text-xs">
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
            className="flex-shrink-0 rounded-lg border border-yellow-400/20 px-3 py-2 text-sm text-stone-200 transition-colors hover:bg-black/70 active:bg-black disabled:opacity-50 lg:py-1.5 lg:text-xs"
          >
            End Match
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 rounded-2xl border border-yellow-400/15 bg-black/55 px-4 py-3 lg:rounded-xl lg:px-3 lg:py-1.5 lg:gap-3">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 lg:text-[10px]">{session.team_name}</p>
            <p className="text-3xl font-black text-yellow-300 tabular-nums sm:text-4xl lg:text-2xl">{teamScore}</p>
          </div>
          <span className="text-2xl font-bold text-stone-700 lg:text-xl">:</span>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 lg:text-[10px]">Opposition</p>
            <p className="text-3xl font-black text-white tabular-nums sm:text-4xl lg:text-2xl">{oppTotal}</p>
          </div>
          <div className="flex gap-1 ml-2 lg:ml-1">
            <button
              onClick={() => handleOppScore(1)}
              disabled={isPending}
              className="rounded-lg bg-green-700 px-2.5 py-1.5 text-xs font-black text-white hover:bg-green-600 active:scale-95 disabled:opacity-50 transition-all min-h-[36px] lg:px-2 lg:py-1 lg:min-h-0"
            >
              SCORED
            </button>
            <button
              onClick={() => handleOppMiss()}
              disabled={isPending}
              className="rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-600 active:scale-95 disabled:opacity-50 transition-all min-h-[36px] lg:px-2 lg:py-1 lg:min-h-0"
            >
              MISSED
            </button>
            <button
              onClick={() => handleOppScore(-1)}
              disabled={isPending || oppScoreManual === 0}
              className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-600 active:scale-95 disabled:opacity-30 transition-all min-h-[36px] lg:px-1.5 lg:py-1 lg:text-xs lg:min-h-0"
              title="Undo"
            >
              ↩
            </button>
          </div>
        </div>
      </div>

      {/* Player cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-1.5">
        {homePlayers.map(player => (
          <PlayerScoreCard
            key={player.player_id}
            player={player}
            statTypes={statTypes}
            onShot={handleShot}
            onUndo={handleUndo}
            onStatEvent={handleStatEvent}
            onUndoStat={handleUndoStat}
            onToggleOpposition={handleToggleOpposition}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Opposition players */}
      {oppPlayers.length > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 lg:mt-1">Opposition</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-1.5">
            {oppPlayers.map(player => (
              <PlayerScoreCard
                key={player.player_id}
                player={player}
                statTypes={statTypes}
                onShot={handleShot}
                onUndo={handleUndo}
                onStatEvent={handleStatEvent}
                onUndoStat={handleUndoStat}
                onToggleOpposition={handleToggleOpposition}
                isPending={isPending}
              />
            ))}
          </div>
        </>
      )}
      <ConfirmModal
        open={showEndModal}
        title="End Match"
        message="End this session? You can reopen it later to edit shots."
        confirmLabel="End Match"
        variant="primary"
        onConfirm={confirmEnd}
        onCancel={() => setShowEndModal(false)}
      />
    </div>
  );
}
