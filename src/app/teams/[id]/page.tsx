import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import StatsView from '@/components/StatsView';
import {
  getDb,
  getAllLeaderboards,
  getAllPlayers,
  getAllSessions,
  getAllStatTypes,
  getMatchResults,
  getQuarterLeaderboards,
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
  const quarterBoards = getQuarterLeaderboards(db, teamId);
  const statTypes = getAllStatTypes(db, true);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Breadcrumb items={[
          { label: 'Teams' },
          { label: team.name },
        ]} />
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">{team.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">Team-level matches, players, and leaderboards.</p>
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
          <div key={card.label} className="border-2 border-[var(--border)] bg-white/25 backdrop-blur-sm p-5 gold-accent">
            <p className="text-3xl font-black text-[var(--text)] font-[family-name:var(--font-display)]">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-dim)]">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Players</h2>
            <Link href="/players" className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
              Club players →
            </Link>
          </div>
          <div className="border-2 border-[var(--border)] bg-white/25 backdrop-blur-sm">
            <ul className="divide-y divide-[var(--border)]">
              {players.map(player => (
                <li key={player.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/players/${player.id}`} className="font-medium text-[var(--text)] transition hover:text-[var(--gold)]">
                    {player.name}
                  </Link>
                  <span className="text-sm text-[var(--text-dim)]">#{player.id}</span>
                </li>
              ))}
              {players.length === 0 && (
                <li className="px-4 py-8 text-center text-[var(--text-dim)]">No players assigned to this team yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Matches</h2>
            <Link href="/sessions" className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
              Full history →
            </Link>
          </div>
          <div className="space-y-3">
            {results.slice(0, 8).map(result => (
              <Link
                key={result.id}
                href={`/sessions/${result.id}/summary`}
                className="flex items-center justify-between border-2 border-[var(--border)] bg-white/25 backdrop-blur-sm px-4 py-4 transition hover:border-[var(--gold)] gold-glow"
              >
                <div>
                  <p className="font-semibold text-[var(--text)]">{result.name ?? 'Training Session'}</p>
                  <p className="text-sm text-[var(--text-dim)]">
                    {new Date(result.started_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[var(--text)] font-[family-name:var(--font-display)]">{result.home} : {result.opp}</p>
                  <p className={`text-xs font-bold ${
                    result.outcome === 'W' ? 'text-[var(--gold)]' : result.outcome === 'D' ? 'text-[var(--text-muted)]' : 'text-[var(--red)]'
                  }`}>
                    {result.outcome}
                  </p>
                </div>
              </Link>
            ))}
            {results.length === 0 && (
              <div className="border-2 border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm p-8 text-center text-[var(--text-dim)]">
                No completed matches with scorelines yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <StatsView
        clubMatch={leaderboards.match}
        clubCareer={leaderboards.career}
        clubQuarter={quarterBoards}
        teams={[]}
        singleTeam
        heading="Team Leaderboards"
        subtitle={`${team.name} records across all matches.`}
      />
    </div>
  );
}
