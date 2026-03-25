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
  const statTypes = getAllStatTypes(db, true);

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
          <h1 className="text-2xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase tracking-wide">{player.name}</h1>
          {stats.team_name && (
            <p className="text-sm text-[var(--gold)]">{stats.team_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-[var(--border-gold)] bg-white/25 backdrop-blur-sm p-4 text-center gold-accent">
          <p className="text-3xl font-black text-[var(--text)] font-[family-name:var(--font-display)]">{stats.sessions_played}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Matches</p>
        </div>
        <div className="rounded border border-[var(--border-gold)] bg-white/25 backdrop-blur-sm p-4 text-center gold-accent">
          <p className="text-3xl font-black text-[var(--text)] font-[family-name:var(--font-display)]">{stats.total_attempted}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Total Shots</p>
        </div>
        <div className="rounded border border-[var(--border-gold)] bg-white/25 backdrop-blur-sm p-4 text-center gold-accent">
          <p
            className={`text-3xl font-black font-[family-name:var(--font-display)] ${
              stats.total_attempted === 0 ? 'text-[var(--text-dim)]'
                : stats.total_made / stats.total_attempted >= 0.7 ? 'text-[var(--gold)]'
                : stats.total_made / stats.total_attempted >= 0.5 ? 'text-amber-300'
                : 'text-[var(--red)]'
            }`}
          >
            {pct(stats.total_made, stats.total_attempted)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Club %</p>
        </div>
      </div>

      {activeStatTypes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {activeStatTypes.map(st => (
            <div key={st.id} className="rounded border border-[var(--border-gold)] bg-white/25 backdrop-blur-sm p-4 text-center gold-accent">
              <p className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)]">
                {stats.career_stat_counts[st.id] ?? 0}
              </p>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{st.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase">Shot % by Match</h2>
        <PlayerStatsChart sessions={stats.sessions} />
      </div>

      {stats.sessions.length > 0 && (
        <div className="overflow-x-auto rounded border border-[var(--border-gold)]">
          <table className="w-full">
            <thead className="bg-white/25 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">
                  Match
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)]">
                  Made
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)]">
                  Att.
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)]">
                  %
                </th>
                {activeStatTypes.map(st => (
                  <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)]">
                    {st.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gold)]/10">
              {stats.sessions.map((s) => (
                <tr
                  key={s.session_id}
                  className="bg-white/20 transition-colors hover:bg-white/25 backdrop-blur-sm"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.session_id}/summary`}
                      className="text-[var(--text)] transition-colors hover:text-[var(--gold)]"
                    >
                      {s.session_name ?? 'Training Session'}
                    </Link>
                    <p className="text-xs text-[var(--text-dim)]">
                      {new Date(s.started_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-[var(--gold)]/80">{s.team_name}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--gold)]">{s.made}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-muted)]">{s.attempted}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">
                    {pct(s.made, s.attempted)}
                  </td>
                  {activeStatTypes.map(st => (
                    <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">
                      {s.stat_counts[st.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.sessions.length === 0 && (
        <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-8 text-center">
          <p className="text-[var(--text-muted)]">No match history yet.</p>
        </div>
      )}
    </div>
  );
}
