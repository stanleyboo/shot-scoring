import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import PlayerStatsChart from '@/components/PlayerStatsChart';
import { getDb, getPlayerById, getPlayerCareerStats, getAllStatTypes } from '@/lib/db';

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
  const statTypes = getAllStatTypes(db);

  // Only show stat types the player has recorded at least once
  const activeStatTypes = statTypes.filter(st => (stats.career_stat_counts[st.id] ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[
          { label: 'Players', href: '/players' },
          { label: player.name },
        ]} />
        <div>
          <h1 className="text-2xl font-bold text-white">{player.name}</h1>
          {stats.team_name && (
            <p className="text-sm text-yellow-300">{stats.team_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-yellow-400/15 bg-black/60 p-4 text-center">
          <p className="text-3xl font-black text-white">{stats.sessions_played}</p>
          <p className="mt-1 text-xs text-stone-500">Matches</p>
        </div>
        <div className="rounded-2xl border border-yellow-400/15 bg-black/60 p-4 text-center">
          <p className="text-3xl font-black text-white">{stats.total_attempted}</p>
          <p className="mt-1 text-xs text-stone-500">Total Shots</p>
        </div>
        <div className="rounded-2xl border border-yellow-400/15 bg-black/60 p-4 text-center">
          <p
            className={`text-3xl font-black ${
              stats.total_attempted === 0 ? 'text-stone-600'
                : stats.total_made / stats.total_attempted >= 0.7 ? 'text-yellow-300'
                : stats.total_made / stats.total_attempted >= 0.5 ? 'text-amber-300'
                : 'text-red-400'
            }`}
          >
            {pct(stats.total_made, stats.total_attempted)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Club %</p>
        </div>
      </div>

      {activeStatTypes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {activeStatTypes.map(st => (
            <div key={st.id} className="rounded-2xl border border-yellow-400/15 bg-black/60 p-4 text-center">
              <p className="text-3xl font-black text-yellow-300">
                {stats.career_stat_counts[st.id] ?? 0}
              </p>
              <p className="mt-1 text-xs text-stone-500">{st.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-stone-200">Shot % by Match</h2>
        <PlayerStatsChart sessions={stats.sessions} />
      </div>

      {stats.sessions.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-yellow-400/15">
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-400">
                  Match
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400">
                  Made
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400">
                  Att.
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400">
                  %
                </th>
                {activeStatTypes.map(st => (
                  <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-stone-400">
                    {st.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-400/10">
              {stats.sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="bg-black/50 transition-colors hover:bg-black/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.session_id}/summary`}
                      className="text-white transition-colors hover:text-yellow-300"
                    >
                      {s.session_name ?? 'Training Session'}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {new Date(s.started_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-yellow-300/80">{s.team_name}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-300">{s.made}</td>
                  <td className="px-4 py-3 text-right text-stone-300">{s.attempted}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {pct(s.made, s.attempted)}
                  </td>
                  {activeStatTypes.map(st => (
                    <td key={st.id} className="px-4 py-3 text-right text-yellow-300">
                      {s.stat_counts[st.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
