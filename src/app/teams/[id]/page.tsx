import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import {
  getDb,
  getAllLeaderboards,
  getAllPlayers,
  getAllSessions,
  getAllStatTypes,
  getMatchResults,
  getTeamById,
  getTeamSummaries,
} from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

function formatPct(goals: number, attempts: number) {
  if (attempts === 0) return '—';
  return `${Math.round((goals / attempts) * 100)}%`;
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const teamId = Number.parseInt(id, 10);
  if (Number.isNaN(teamId)) notFound();

  const db = getDb();
  const team = getTeamById(db, teamId);
  if (!team) notFound();

  const summary = getTeamSummaries(db).find(entry => entry.id === teamId);
  if (!summary) notFound();

  const players = getAllPlayers(db, teamId);
  const sessions = getAllSessions(db, teamId);
  const results = getMatchResults(db, teamId);
  const leaderboards = getAllLeaderboards(db, teamId);
  const statTypes = getAllStatTypes(db);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Breadcrumb items={[
          { label: 'Teams' },
          { label: team.name },
        ]} />
        <div>
          <h1 className="text-3xl font-black text-yellow-300">{team.name}</h1>
          <p className="text-sm text-stone-400">Team-level matches, players, and leaderboards.</p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Players', value: summary.player_count.toString() },
          { label: 'Matches', value: summary.session_count.toString() },
          { label: 'Goals', value: summary.total_goals.toString() },
          { label: 'Accuracy', value: formatPct(summary.total_goals, summary.total_attempts) },
          { label: 'Record', value: `${summary.wins}-${summary.draws}-${summary.losses}` },
        ].map(card => (
          <div key={card.label} className="border-2 border-stone-900 bg-[#111111] p-5">
            <p className="text-3xl font-black text-white">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Players</h2>
            <Link href="/players" className="text-sm text-yellow-300 hover:text-yellow-200">
              Club players →
            </Link>
          </div>
          <div className="border-2 border-stone-900 bg-[#111111]">
            <ul className="divide-y divide-stone-900">
              {players.map(player => (
                <li key={player.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/players/${player.id}`} className="font-medium text-white transition hover:text-yellow-300">
                    {player.name}
                  </Link>
                  <span className="text-sm text-stone-500">#{player.id}</span>
                </li>
              ))}
              {players.length === 0 && (
                <li className="px-4 py-8 text-center text-stone-500">No players assigned to this team yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Matches</h2>
            <Link href="/sessions" className="text-sm text-yellow-300 hover:text-yellow-200">
              Full history →
            </Link>
          </div>
          <div className="space-y-3">
            {results.slice(0, 8).map(result => (
              <Link
                key={result.id}
                href={`/sessions/${result.id}/summary`}
                className="flex items-center justify-between border-2 border-stone-900 bg-[#111111] px-4 py-4 transition hover:border-yellow-400 hover:bg-black"
              >
                <div>
                  <p className="font-semibold text-white">{result.name ?? 'Training Session'}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(result.started_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{result.home} : {result.opp}</p>
                  <p className={`text-xs font-bold ${
                    result.outcome === 'W' ? 'text-yellow-300' : result.outcome === 'D' ? 'text-stone-300' : 'text-red-400'
                  }`}>
                    {result.outcome}
                  </p>
                </div>
              </Link>
            ))}
            {results.length === 0 && (
              <div className="border-2 border-dashed border-yellow-400/30 bg-black p-8 text-center text-stone-500">
                No completed matches with scorelines yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Team Leaderboards</h2>
        {(leaderboards.match.length > 0 || leaderboards.career.length > 0) ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[...leaderboards.match, ...leaderboards.career].map(board => (
              <div key={`${board.title}-${board.subtitle}`} className="overflow-hidden border-2 border-stone-900 bg-[#111111]">
                <div className="border-b-2 border-stone-900 bg-yellow-400 px-4 py-3">
                  <p className="text-sm font-black uppercase tracking-wide text-black">{board.title}</p>
                  <p className="text-xs text-black">{board.subtitle}</p>
                </div>
                <ul className="divide-y divide-stone-900">
                  {board.entries.slice(0, 5).map(entry => (
                    <li key={`${board.title}-${entry.player_id}-${entry.label ?? 'career'}`} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <Link href={`/players/${entry.player_id}`} className="block truncate text-sm font-medium text-white transition hover:text-yellow-300">
                          {entry.name}
                        </Link>
                        {entry.label && <p className="truncate text-xs text-stone-500">{entry.label}</p>}
                      </div>
                      <span className="text-sm font-bold text-white">
                        {board.format === 'percent' ? `${entry.value}%` : entry.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-yellow-400/30 bg-black p-8 text-center text-stone-500">
            Team leaderboards will populate once match data is recorded.
          </div>
        )}
      </section>

      {sessions.length > 0 && statTypes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">Tracked Stats</h2>
          <p className="text-sm text-stone-400">
            Active stat types: {statTypes.map(statType => statType.name).join(', ')}
          </p>
        </section>
      )}
    </div>
  );
}
