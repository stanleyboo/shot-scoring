import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlayerStatsChart from '@/components/PlayerStatsChart';
import { getDb, getPlayerById, getPlayerCareerStats } from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

function pct(made: number, attempted: number): string {
  if (attempted === 0) return '—';
  return `${Math.round((made / attempted) * 100)}%`;
}

export default async function PlayerProfilePage({ params }: Props) {
  const { id } = await params;
  const playerId = Number.parseInt(id, 10);
  if (Number.isNaN(playerId)) notFound();

  const db = getDb();
  const player = getPlayerById(db, playerId);
  if (!player) notFound();

  const stats = getPlayerCareerStats(db, playerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/players"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">{player.name}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-3xl font-black text-slate-100">{stats.sessions_played}</p>
          <p className="mt-1 text-xs text-slate-500">Sessions</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-3xl font-black text-slate-100">{stats.total_attempted}</p>
          <p className="mt-1 text-xs text-slate-500">Total Shots</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p
            className={`text-3xl font-black ${
              stats.total_attempted === 0
                ? 'text-slate-600'
                : stats.total_made / stats.total_attempted >= 0.7
                  ? 'text-green-400'
                  : stats.total_made / stats.total_attempted >= 0.5
                    ? 'text-yellow-400'
                    : 'text-red-400'
            }`}
          >
            {pct(stats.total_made, stats.total_attempted)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Career %</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-300">Shot % by Session</h2>
        <PlayerStatsChart sessions={stats.sessions} />
      </div>

      {stats.sessions.length > 0 && (
        <div className="rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  Session
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                  Made
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                  Att.
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stats.sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.session_id}/summary`}
                      className="text-slate-100 hover:text-indigo-400 transition-colors"
                    >
                      {s.session_name ?? 'Training Session'}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {new Date(s.started_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">{s.made}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{s.attempted}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-100">
                    {pct(s.made, s.attempted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
