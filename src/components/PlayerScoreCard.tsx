import type { SessionWithStats } from '@/lib/db';

type PlayerStats = SessionWithStats['players'][number];

interface Props {
  player: PlayerStats;
  onShot: (playerId: number, scored: boolean) => void;
  onUndo: (playerId: number) => void;
  isPending: boolean;
}

export default function PlayerScoreCard({ player, onShot, onUndo, isPending }: Props) {
  const { player_id, name, made, attempted } = player;
  const pct = attempted === 0 ? null : Math.round((made / attempted) * 100);

  const pctColor =
    pct === null
      ? 'text-slate-600'
      : pct >= 70
      ? 'text-green-400'
      : pct >= 50
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">{name}</h2>
          <p className="text-sm text-slate-500">
            {attempted === 0 ? 'No shots yet' : `${made} of ${attempted}`}
          </p>
        </div>
        <span className={`text-4xl font-black leading-none ${pctColor}`}>
          {pct === null ? '—' : `${pct}%`}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onShot(player_id, true)}
          disabled={isPending}
          className="flex-1 rounded-xl bg-green-600 py-5 text-lg font-black text-white hover:bg-green-500 active:scale-95 disabled:opacity-50 transition-all"
        >
          SCORED
        </button>
        <button
          onClick={() => onShot(player_id, false)}
          disabled={isPending}
          className="flex-1 rounded-xl bg-red-600 py-5 text-lg font-black text-white hover:bg-red-500 active:scale-95 disabled:opacity-50 transition-all"
        >
          MISSED
        </button>
        <button
          onClick={() => onUndo(player_id)}
          disabled={isPending || attempted === 0}
          title="Undo last shot"
          className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-5 text-xl text-slate-300 hover:bg-slate-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ↩
        </button>
      </div>
    </div>
  );
}
