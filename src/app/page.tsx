import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  getDb,
  getActiveSession,
  getAllLeaderboards,
  getAllPlayers,
  getAllSessions,
  getMatchResults,
  getTeamSummaries,
} from '@/lib/db';
import { canCreate, canEdit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatPct(goals: number, attempts: number) {
  if (attempts === 0) return '—';
  return `${Math.round((goals / attempts) * 100)}%`;
}

export default async function HomePage() {
  const db = getDb();
  const active = getActiveSession(db);
  if (active) {
    const editor = await canEdit();
    if (editor) redirect(`/sessions/${active.id}`);
    redirect('/sessions');
  }

  const creator = await canCreate();
  const sessions = getAllSessions(db);
  const players = getAllPlayers(db);
  const teams = getTeamSummaries(db);
  const results = getMatchResults(db);
  const { career } = getAllLeaderboards(db);
  const totalMatches = sessions.filter(session => session.ended_at).length;
  const totalShots = teams.reduce((count, team) => count + team.total_attempts, 0);
  const totalGoals = teams.reduce((count, team) => count + team.total_goals, 0);
  const topScorer = career.find(board => board.title === 'Most Goals')?.entries[0];
  const bestShooter = career.find(board => board.title === 'Best Shot %')?.entries[0];

  return (
    <div className="space-y-8">
      <section className="border-2 border-yellow-400 rounded-lg bg-black p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-yellow-300/80">Club Dashboard</p>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-yellow-300 sm:text-5xl">Langwith Netball</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-300 sm:text-base">
                Match history, player records, and leaderboards with separate breakdowns for every Langwith team.
              </p>
            </div>
          </div>
          {creator && (
            <Link
              href="/sessions/new"
              className="inline-flex items-center justify-center border-2 border-yellow-400 bg-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300"
            >
              Start New Match
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Completed Matches', value: totalMatches.toString() },
          { label: 'Club Players', value: players.length.toString() },
          { label: 'Total Goals', value: totalGoals.toString() },
          { label: 'Club Accuracy', value: formatPct(totalGoals, totalShots) },
        ].map(card => (
          <div key={card.label} className="border border-stone-800 bg-[#111] rounded-lg p-5">
            <p className="text-3xl font-black text-white">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.1em] text-stone-500">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Team Breakdown</h2>
          <Link href="/players" className="text-sm text-yellow-300 hover:text-yellow-200">
            Manage players →
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {teams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="border border-stone-800 bg-[#111] rounded-lg p-5 transition hover:border-yellow-400"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-yellow-300">{team.name}</h3>
                  <p className="mt-1 text-sm text-stone-400">
                    {team.player_count} players, {team.session_count} matches
                  </p>
                </div>
                <span className="bg-yellow-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
                  {team.wins}-{team.draws}-{team.losses}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-black text-white">{team.total_goals}</p>
                  <p className="text-xs text-stone-500">Goals</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{team.total_attempts}</p>
                  <p className="text-xs text-stone-500">Attempts</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-yellow-300">{formatPct(team.total_goals, team.total_attempts)}</p>
                  <p className="text-xs text-stone-500">Accuracy</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Recent Matches</h2>
            <Link href="/sessions" className="text-sm text-yellow-300 hover:text-yellow-200">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {results.slice(0, 6).map(result => (
              <Link
                key={result.id}
                href={`/sessions/${result.id}/summary`}
                className="flex items-center justify-between border border-stone-800 bg-[#111] rounded-lg px-4 py-4 transition hover:border-yellow-400"
              >
                <div>
                  <p className="font-semibold text-white">{result.name ?? 'Training Session'}</p>
                  <p className="text-sm text-stone-500">
                    {result.team_name} • {new Date(result.started_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">
                    {result.home} : {result.opp}
                  </p>
                  <p className={`text-xs font-bold ${
                    result.outcome === 'W' ? 'text-yellow-300' : result.outcome === 'D' ? 'text-stone-300' : 'text-red-400'
                  }`}>
                    {result.outcome}
                  </p>
                </div>
              </Link>
            ))}
            {results.length === 0 && (
              <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-8 text-center text-stone-500">
                No scored matches yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Club Leaders</h2>
          <div className="grid gap-4">
            {topScorer && (
              <Link href={`/players/${topScorer.player_id}`} className="border border-stone-800 bg-[#111] rounded-lg p-5 transition hover:border-yellow-400">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">Top Scorer</p>
                <p className="mt-2 text-2xl font-black text-white">{topScorer.name}</p>
                <p className="text-sm text-yellow-300">{topScorer.value} club goals</p>
              </Link>
            )}
            {bestShooter && (
              <Link href={`/players/${bestShooter.player_id}`} className="border border-stone-800 bg-[#111] rounded-lg p-5 transition hover:border-yellow-400">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">Best Accuracy</p>
                <p className="mt-2 text-2xl font-black text-white">{bestShooter.name}</p>
                <p className="text-sm text-yellow-300">{bestShooter.value}% shooting</p>
              </Link>
            )}
            <Link href="/stats" className="bg-yellow-400 rounded-lg px-5 py-5 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300">
              Open full club and team leaderboards →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
