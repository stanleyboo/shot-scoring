import type { SessionWithStats, StatType } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

interface Props {
  player: PlayerStats;
  statTypes: StatType[];
  onShot: (playerId: number, scored: boolean) => void;
  onUndo: (playerId: number) => void;
  onStatEvent: (playerId: number, statTypeId: number) => void;
  onUndoStat: (playerId: number, statTypeId: number) => void;
  onToggleOpposition: (playerId: number) => void;
  isPending: boolean;
}

export default function PlayerScoreCard({
  player,
  statTypes,
  onShot,
  onUndo,
  onStatEvent,
  onUndoStat,
  onToggleOpposition,
  isPending,
}: Props) {
  const { player_id, name, made, attempted, is_opposition, stat_counts } = player;
  const pct = attempted === 0 ? null : Math.round((made / attempted) * 100);

  const pctColor =
    pct === null
      ? 'text-stone-600'
      : pct >= 70
        ? 'text-yellow-300'
        : pct >= 50
          ? 'text-amber-300'
          : 'text-red-400';

  const borderColor = is_opposition ? 'border-red-800/60' : 'border-yellow-400/15';

  return (
    <div className={`rounded-2xl border ${borderColor} bg-black/60 p-3 space-y-2 lg:rounded-lg lg:p-1.5 lg:space-y-1`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-base font-bold text-white truncate sm:text-lg lg:text-sm">{name}</h2>
          <p className="text-xs text-stone-500 flex-shrink-0">
            {attempted === 0 ? '' : `${made}/${attempted}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleOpposition(player_id)}
            disabled={isPending}
            title={is_opposition ? 'Move to home team' : 'Mark as opposition'}
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              is_opposition
                ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80'
                : 'bg-yellow-400/10 text-stone-400 hover:text-yellow-300 hover:bg-yellow-400/15'
            }`}
          >
            {is_opposition ? 'OPP' : 'Home'}
          </button>
          <span className={`text-2xl font-black leading-none lg:text-xl ${pctColor}`}>
            {pct === null ? '—' : `${pct}%`}
          </span>
        </div>
      </div>

      {/* Shot buttons */}
      <div className="flex gap-1.5 lg:gap-1">
        <button
          onClick={() => onShot(player_id, true)}
          disabled={isPending}
          className="flex-1 rounded-xl bg-yellow-400 py-3 text-sm font-black text-black hover:bg-yellow-300 active:scale-95 disabled:opacity-50 transition-all min-h-[44px] sm:text-base lg:rounded-md lg:py-1 lg:text-[11px] lg:min-h-0"
        >
          SCORED
        </button>
        <button
          onClick={() => onShot(player_id, false)}
          disabled={isPending}
          className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-500 active:scale-95 disabled:opacity-50 transition-all min-h-[44px] sm:text-base lg:rounded-md lg:py-1 lg:text-[11px] lg:min-h-0"
        >
          MISSED
        </button>
        <button
          onClick={() => onUndo(player_id)}
          disabled={isPending || attempted === 0}
          title="Undo last shot"
          className="rounded-xl border border-yellow-400/15 bg-black px-2.5 py-3 text-base text-stone-300 hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 transition-all min-h-[44px] lg:rounded-md lg:px-1.5 lg:py-1 lg:text-xs lg:min-h-0"
        >
          ↩
        </button>
      </div>

      {/* Stat counter chips */}
      {statTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 lg:gap-1">
          {statTypes.map(st => {
            const count = stat_counts[st.id] ?? 0;
            return (
              <div
                key={st.id}
                className="flex items-center overflow-hidden rounded-lg border border-yellow-400/10 bg-black/70"
              >
                <button
                  onClick={() => onStatEvent(player_id, st.id)}
                  disabled={isPending}
                  className="flex min-h-[40px] flex-1 items-center justify-between gap-1 px-2.5 py-2 text-sm text-stone-200 transition-all hover:bg-yellow-400/10 active:scale-[0.97] active:bg-yellow-400/15 disabled:opacity-50 lg:min-h-0 lg:px-2 lg:py-0.5 lg:text-xs"
                  title={`Add ${st.name}`}
                >
                  <span className="truncate text-stone-400">{st.name}</span>
                  <span className="font-bold text-yellow-300 tabular-nums">{count}</span>
                </button>
                <button
                  onClick={() => onUndoStat(player_id, st.id)}
                  disabled={isPending || count === 0}
                  title={`Undo ${st.name}`}
                  className="min-h-[40px] border-l border-yellow-400/10 px-1.5 py-2 text-sm text-stone-500 transition-all hover:bg-yellow-400/10 hover:text-stone-300 active:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-30 lg:min-h-0 lg:px-1 lg:py-0.5 lg:text-xs"
                >
                  ↩
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
