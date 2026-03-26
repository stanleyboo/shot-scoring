import type { SessionWithStats, StatType, NETBALL_POSITIONS } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

interface Props {
  player: PlayerStats;
  statTypes: StatType[];
  currentQuarter: number;
  onShot: (playerId: number, scored: boolean) => void;
  onUndo: (playerId: number) => void;
  onStatEvent: (playerId: number, statTypeId: number) => void;
  onUndoStat: (playerId: number, statTypeId: number) => void;
  onToggleOpposition: (playerId: number) => void;
  onSetPosition: (playerId: number, position: string | null) => void;
  onToggleQuarter: (playerId: number, quarter: number) => void;
  isPending: boolean;
}

const POSITIONS: (typeof NETBALL_POSITIONS)[number][] = ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'];

export default function PlayerScoreCard({
  player,
  statTypes,
  currentQuarter,
  onShot,
  onUndo,
  onStatEvent,
  onUndoStat,
  onToggleOpposition,
  onSetPosition,
  onToggleQuarter,
  isPending,
}: Props) {
  const { player_id, name, made, attempted, is_opposition, position, quarters_played, stat_counts } = player;
  const pct = attempted === 0 ? null : Math.round((made / attempted) * 100);
  const qtrsCount = quarters_played.length;
  const goalsPerQtr = qtrsCount > 0 ? (made / qtrsCount).toFixed(1) : null;

  const pctColor =
    pct === null
      ? 'text-[var(--text-dim)]'
      : pct >= 70
        ? 'text-[var(--gold)]'
        : pct >= 50
          ? 'text-amber-300'
          : 'text-[var(--red)]';

  const isOnCourt = quarters_played.includes(currentQuarter);

  return (
    <div className={`rounded border-l-3 ${is_opposition ? 'border-l-[var(--red)]' : 'border-l-[var(--gold)]'} border ${is_opposition ? 'border-[var(--red)]/40' : 'border-[var(--border-gold)]'} bg-white/25 backdrop-blur-sm p-2.5 space-y-1 lg:p-1.5 lg:space-y-1 ${!isOnCourt ? 'opacity-50' : ''}`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-base font-bold text-[var(--text)] truncate sm:text-lg lg:text-sm font-[family-name:var(--font-display)] uppercase">{name}</h2>
          {/* Position picker */}
          {!is_opposition && (
            <select
              value={position ?? ''}
              onChange={e => onSetPosition(player_id, e.target.value || null)}
              disabled={isPending}
              className="bg-transparent border border-[var(--gold)]/20 rounded px-1 py-0.5 text-[10px] font-bold text-[var(--gold)] uppercase focus:outline-none focus:border-[var(--gold)] cursor-pointer min-w-[40px]"
            >
              <option value="">—</option>
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          )}
          <p className="text-xs text-[var(--text-dim)] flex-shrink-0">
            {attempted === 0 ? '' : `${made}/${attempted}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleOpposition(player_id)}
            disabled={isPending}
            title={is_opposition ? 'Move to home team' : 'Mark as opposition'}
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              is_opposition
                ? 'bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/40'
                : 'bg-[var(--gold)]/10 text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/15'
            }`}
          >
            {is_opposition ? 'OPP' : 'Home'}
          </button>
          <span className={`text-2xl font-black leading-none lg:text-xl ${pctColor} font-[family-name:var(--font-display)]`}>
            {pct === null ? '—' : `${pct}%`}
          </span>
        </div>
      </div>

      {/* Quarter participation toggles */}
      {!is_opposition && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wide text-[var(--text-dim)] mr-1">Court:</span>
          {[1, 2, 3, 4].map(q => (
            <button
              key={q}
              onClick={() => onToggleQuarter(player_id, q)}
              disabled={isPending}
              className={`w-6 h-6 rounded text-[10px] font-bold transition-all lg:w-5 lg:h-5 lg:text-[9px] ${
                quarters_played.includes(q)
                  ? 'bg-[var(--gold)] text-[var(--bg)]'
                  : 'border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--gold)]'
              }`}
            >
              {q}
            </button>
          ))}
          {qtrsCount > 0 && goalsPerQtr !== null && (
            <span className="text-[10px] text-[var(--text-dim)] ml-auto">{goalsPerQtr}/qtr</span>
          )}
        </div>
      )}

      {/* Shot buttons */}
      <div className="grid grid-cols-2 gap-1 lg:gap-1">
        <div className="flex items-center overflow-hidden rounded border border-[var(--green)]/30 bg-[var(--green)]/10 min-w-0">
          <button
            onClick={() => onShot(player_id, true)}
            disabled={isPending}
            className="flex min-h-[40px] min-w-0 flex-1 items-center justify-center px-2 py-1.5 text-sm font-black text-[var(--green)] transition-all hover:bg-[var(--green)]/20 active:scale-[0.97] active:bg-[var(--green)]/30 disabled:opacity-50 lg:min-h-0 lg:px-1.5 lg:py-0.5 lg:text-xs"
          >
            SCORED
          </button>
          <button
            onClick={() => onUndo(player_id)}
            disabled={isPending || attempted === 0}
            title="Undo last shot"
            className="min-h-[40px] flex-shrink-0 border-l border-[var(--green)]/20 px-2 py-1.5 text-sm text-[var(--green)]/50 transition-all hover:bg-[var(--green)]/20 hover:text-[var(--green)] active:bg-[var(--green)]/30 disabled:cursor-not-allowed disabled:opacity-30 lg:min-h-0 lg:px-1.5 lg:py-0.5 lg:text-xs"
          >
            ↩
          </button>
        </div>
        <button
          onClick={() => onShot(player_id, false)}
          disabled={isPending}
          className="flex min-h-[40px] items-center justify-center rounded border border-[var(--red)]/30 bg-[var(--red)]/10 px-2 py-1.5 text-sm font-black text-[var(--red)] transition-all hover:bg-[var(--red)]/20 active:scale-[0.97] active:bg-[var(--red)]/30 disabled:opacity-50 lg:min-h-0 lg:px-1.5 lg:py-0.5 lg:text-xs"
        >
          MISSED
        </button>
      </div>

      {/* Stat counter chips */}
      {statTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-1 lg:gap-1">
          {statTypes.map(st => {
            const count = stat_counts[st.id] ?? 0;
            return (
              <div
                key={st.id}
                className="flex items-center overflow-hidden rounded border border-[var(--gold)]/10 bg-white/25 backdrop-blur-sm min-w-0"
              >
                <button
                  onClick={() => onStatEvent(player_id, st.id)}
                  disabled={isPending}
                  className="flex min-h-[40px] min-w-0 flex-1 items-center gap-1 px-2 py-1.5 text-sm text-[var(--text-muted)] transition-all hover:bg-[var(--gold)]/10 active:scale-[0.97] active:bg-[var(--gold)]/15 disabled:opacity-50 lg:min-h-0 lg:px-1.5 lg:py-0.5 lg:text-xs"
                  title={`Add ${st.name}`}
                >
                  <span className="truncate text-[var(--text-dim)] min-w-0 flex-1 text-left text-xs">{st.name}</span>
                  <span className="font-bold text-[var(--gold)] tabular-nums flex-shrink-0">{count}</span>
                </button>
                <button
                  onClick={() => onUndoStat(player_id, st.id)}
                  disabled={isPending || count === 0}
                  title={`Undo ${st.name}`}
                  className="min-h-[40px] flex-shrink-0 border-l border-[var(--gold)]/10 px-2 py-1.5 text-sm text-[var(--text-dim)] transition-all hover:bg-[var(--gold)]/10 hover:text-[var(--text-muted)] active:bg-[var(--gold)]/15 disabled:cursor-not-allowed disabled:opacity-30 lg:min-h-0 lg:px-1.5 lg:py-0.5 lg:text-xs"
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
