'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordShot, undoLastShot } from '@/actions/shots';
import { recordStatEvent, undoLastStatEvent } from '@/actions/stats';
import { endSession, updateOppositionScore, togglePlayerOpposition, setPlayerPosition, togglePlayerQuarter } from '@/actions/sessions';
import PlayerScoreCard from './PlayerScoreCard';
import ConfirmModal from './ConfirmModal';
import { useToast } from './ToastProvider';
import type { Session, SessionWithStats, StatType } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

type OptimisticAction =
  | { type: 'shot'; playerId: number; scored: boolean }
  | { type: 'stat'; playerId: number; statTypeId: number; delta: number }
  | { type: 'toggle_opp'; playerId: number }
  | { type: 'set_position'; playerId: number; position: string | null }
  | { type: 'toggle_quarter'; playerId: number; quarter: number };

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
  const [oppHistory, setOppHistory] = useState<({ type: 'scored' | 'missed' } | { type: 'reset'; prevScore: number; prevAttempted: number })[]>([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [quarter, setQuarter] = useState(1);
  const [positionFilter, setPositionFilter] = useState<string>('');
  const { toast } = useToast();

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
        if (action.type === 'set_position') {
          return { ...p, position: action.position };
        }
        if (action.type === 'toggle_quarter') {
          const qp = [...p.quarters_played];
          const idx = qp.indexOf(action.quarter);
          if (idx >= 0) qp.splice(idx, 1);
          else qp.push(action.quarter);
          return { ...p, quarters_played: qp.sort() };
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

  const homePlrs = optimisticPlayers.filter(p => !p.is_opposition);
  const oppPlrs = optimisticPlayers.filter(p => p.is_opposition);
  const teamScore = homePlrs.reduce((n, p) => n + p.made, 0);
  const teamAttempts = homePlrs.reduce((n, p) => n + p.attempted, 0);
  const oppShotScore = oppPlrs.reduce((n, p) => n + p.made, 0);
  const oppTotal = oppScoreManual + oppShotScore;
  const oppTotalAttempts = oppAttemptedManual + oppPlrs.reduce((n, p) => n + p.attempted, 0);
  const teamPct = teamAttempts > 0 ? Math.round((teamScore / teamAttempts) * 100) : null;
  const oppPct = oppTotalAttempts > 0 ? Math.round((oppTotal / oppTotalAttempts) * 100) : null;

  function handleShot(playerId: number, scored: boolean) {
    startTransition(async () => {
      addOptimistic({ type: 'shot', playerId, scored });
      await recordShot(session.id, playerId, scored, quarter);
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
      await recordStatEvent(session.id, playerId, statTypeId, quarter);
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

  function handleSetPosition(playerId: number, position: string | null) {
    startTransition(async () => {
      addOptimistic({ type: 'set_position', playerId, position });
      await setPlayerPosition(session.id, playerId, position);
    });
  }

  function handleToggleQuarter(playerId: number, q: number) {
    startTransition(async () => {
      addOptimistic({ type: 'toggle_quarter', playerId, quarter: q });
      await togglePlayerQuarter(session.id, playerId, q);
    });
  }

  function handleOppScored() {
    const nextScore = oppScoreManual + 1;
    const nextAttempted = oppAttemptedManual + 1;
    setOppScoreManual(nextScore);
    setOppAttemptedManual(nextAttempted);
    setOppHistory(h => [...h, { type: 'scored' }]);
    startTransition(async () => {
      await updateOppositionScore(session.id, nextScore, nextAttempted);
    });
  }

  function handleOppMiss() {
    const nextAttempted = oppAttemptedManual + 1;
    setOppAttemptedManual(nextAttempted);
    setOppHistory(h => [...h, { type: 'missed' }]);
    startTransition(async () => {
      await updateOppositionScore(session.id, oppScoreManual, nextAttempted);
    });
  }

  function handleOppReset() {
    const prevScore = oppScoreManual;
    const prevAttempted = oppAttemptedManual;
    setOppScoreManual(0);
    setOppAttemptedManual(0);
    setOppHistory(h => [...h, { type: 'reset', prevScore, prevAttempted }]);
    startTransition(async () => {
      await updateOppositionScore(session.id, 0, 0);
    });
  }

  function handleOppUndo() {
    if (oppHistory.length === 0) return;
    const last = oppHistory[oppHistory.length - 1];
    let nextScore: number;
    let nextAttempted: number;
    if (last.type === 'reset') {
      nextScore = last.prevScore;
      nextAttempted = last.prevAttempted;
    } else {
      nextScore = last.type === 'scored' ? Math.max(0, oppScoreManual - 1) : oppScoreManual;
      nextAttempted = Math.max(0, oppAttemptedManual - 1);
    }
    setOppScoreManual(nextScore);
    setOppAttemptedManual(nextAttempted);
    setOppHistory(h => h.slice(0, -1));
    startTransition(async () => {
      await updateOppositionScore(session.id, nextScore, nextAttempted);
    });
  }

  function handleEnd() {
    setShowEndModal(true);
  }

  function confirmEnd() {
    setShowEndModal(false);
    startTransition(async () => {
      await endSession(session.id);
      toast('Match ended');
      router.push(`/sessions/${session.id}/summary`);
    });
  }

  const POSITIONS = ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'];
  const homePlayers = optimisticPlayers.filter(p => !p.is_opposition);
  const oppPlayers = optimisticPlayers.filter(p => p.is_opposition);
  const filteredHome = positionFilter
    ? homePlayers.filter(p => p.position === positionFilter)
    : homePlayers;

  // Sort: players with positions first (in netball order), then no-position
  const sortedHome = [...filteredHome].sort((a, b) => {
    const ai = a.position ? POSITIONS.indexOf(a.position) : 99;
    const bi = b.position ? POSITIONS.indexOf(b.position) : 99;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4 lg:space-y-2">
      {/* Session header + scoreboard */}
      <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center justify-between gap-2 lg:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[var(--text)] truncate sm:text-xl lg:text-base font-[family-name:var(--font-display)] uppercase">
              {session.name ?? 'Training Session'}
            </h1>
            <p className="text-xs text-[var(--gold)] sm:text-sm lg:text-xs">{session.team_name}</p>
            <p className="text-xs text-[var(--text-dim)] sm:text-sm lg:text-xs">
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
            className="flex-shrink-0 rounded border border-[var(--border-gold)] px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-black/70 active:bg-black disabled:opacity-50 lg:py-1.5 lg:text-xs"
          >
            End Match
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 rounded border border-[var(--border-gold)] bg-black/55 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3 lg:px-3 lg:py-1.5 lg:gap-3">
          <div className="text-center min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-dim)] truncate sm:text-xs lg:text-[10px]">{session.team_name}</p>
            <p className="text-2xl font-black text-[var(--gold)] tabular-nums sm:text-3xl lg:text-2xl font-[family-name:var(--font-display)]">{teamScore}</p>
            <p className="text-[10px] text-[var(--text-dim)] tabular-nums">{teamPct !== null ? `${teamPct}%` : '—'}</p>
          </div>
          <span className="text-xl font-bold text-[var(--text-dim)] sm:text-2xl lg:text-xl">:</span>
          <div className="text-center min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-dim)] sm:text-xs lg:text-[10px]">Opp</p>
            <p className="text-2xl font-black text-white tabular-nums sm:text-3xl lg:text-2xl font-[family-name:var(--font-display)]">{oppTotal}</p>
            <p className="text-[10px] text-[var(--text-dim)] tabular-nums">{oppPct !== null ? `${oppPct}%` : '—'}</p>
          </div>
          <div className="flex gap-1 ml-1 sm:ml-2 lg:ml-1">
            <button
              onClick={() => handleOppScored()}
              disabled={isPending}
              className="rounded bg-[var(--gold)] px-2 py-1 text-[10px] font-black text-black hover:bg-[var(--gold-hover)] active:scale-95 disabled:opacity-50 transition-all sm:px-2.5 sm:py-1.5 sm:text-xs lg:px-2 lg:py-1 lg:min-h-0"
            >
              SCORED
            </button>
            <button
              onClick={() => handleOppMiss()}
              disabled={isPending}
              className="rounded bg-[var(--red)] px-2 py-1 text-[10px] font-black text-white hover:bg-[var(--red-hover)] active:scale-95 disabled:opacity-50 transition-all sm:px-2.5 sm:py-1.5 sm:text-xs lg:px-2 lg:py-1 lg:min-h-0"
            >
              MISSED
            </button>
            <button
              onClick={() => handleOppUndo()}
              disabled={isPending || oppHistory.length === 0}
              className="rounded bg-[var(--border)] px-1.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--text-dim)] active:scale-95 disabled:opacity-30 transition-all sm:px-2 sm:py-1.5 sm:text-sm lg:px-1.5 lg:py-1 lg:text-xs lg:min-h-0"
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick={() => handleOppReset()}
              disabled={isPending || (oppScoreManual === 0 && oppAttemptedManual === 0)}
              className="rounded bg-[var(--border)] px-1.5 py-1 text-[10px] font-bold text-[var(--text-muted)] hover:bg-[var(--text-dim)] active:scale-95 disabled:opacity-30 transition-all sm:px-2 sm:py-1.5 sm:text-xs lg:px-1.5 lg:py-1 lg:text-xs lg:min-h-0"
              title="Reset opponent score"
            >
              RST
            </button>
          </div>
        </div>
      </div>

      {/* Quarter selector */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4].map(q => (
          <button
            key={q}
            type="button"
            onClick={() => setQuarter(q)}
            className={`px-4 py-2 text-sm font-bold rounded transition-all font-[family-name:var(--font-display)] text-base ${
              quarter === q
                ? 'bg-[var(--gold)] text-black'
                : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]'
            }`}
          >
            Q{q}
          </button>
        ))}
      </div>

      {/* Position filter */}
      {homePlayers.some(p => p.position) && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => setPositionFilter('')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all ${
              !positionFilter
                ? 'bg-[var(--gold)] text-black'
                : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)]'
            }`}
          >
            All
          </button>
          {POSITIONS.filter(pos => homePlayers.some(p => p.position === pos)).map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(positionFilter === pos ? '' : pos)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                positionFilter === pos
                  ? 'bg-[var(--gold)] text-black'
                  : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)]'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      )}

      {/* Player cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-1.5">
        {sortedHome.map(player => (
          <PlayerScoreCard
            key={player.player_id}
            player={player}
            statTypes={statTypes}
            currentQuarter={quarter}
            onShot={handleShot}
            onUndo={handleUndo}
            onStatEvent={handleStatEvent}
            onUndoStat={handleUndoStat}
            onToggleOpposition={handleToggleOpposition}
            onSetPosition={handleSetPosition}
            onToggleQuarter={handleToggleQuarter}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Opposition players */}
      {oppPlayers.length > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] lg:mt-1 font-[family-name:var(--font-display)] text-sm">Opposition</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-1.5">
            {oppPlayers.map(player => (
              <PlayerScoreCard
                key={player.player_id}
                player={player}
                statTypes={statTypes}
                currentQuarter={quarter}
                onShot={handleShot}
                onUndo={handleUndo}
                onStatEvent={handleStatEvent}
                onUndoStat={handleUndoStat}
                onToggleOpposition={handleToggleOpposition}
                onSetPosition={handleSetPosition}
                onToggleQuarter={handleToggleQuarter}
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
