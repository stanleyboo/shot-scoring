import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, getAllTeams, getTeamSummaries } from '@/lib/db';
import { isAdmin, getSettings, canViewPage } from '@/lib/auth';
import AddTeamForm from '@/components/AddTeamForm';
import TeamList from '@/components/TeamList';

export const dynamic = 'force-dynamic';

function formatPct(goals: number, attempts: number) {
  if (attempts === 0) return '—';
  return `${Math.round((goals / attempts) * 100)}%`;
}

export default async function TeamsPage() {
  if (!(await canViewPage(getSettings().page_teams))) redirect('/');
  const db = getDb();
  const admin = await isAdmin();
  const teams = getAllTeams(db);
  const summaries = getTeamSummaries(db);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Teams</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage squads and view team stats.</p>
      </div>

      {admin && <AddTeamForm />}

      {teams.length === 0 ? (
        <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-12 text-center">
          <p className="text-[var(--text-muted)]">No teams yet. Add one above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded p-5 transition hover:border-[var(--gold)] gold-glow gold-accent"
            >
              <h3 className="text-xl font-bold text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">{team.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {team.player_count} players, {team.session_count} matches
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-black text-[var(--text)] font-[family-name:var(--font-display)]">{team.total_goals}</p>
                  <p className="text-xs text-[var(--text-dim)]">Goals</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[var(--text)] font-[family-name:var(--font-display)]">{team.total_attempts}</p>
                  <p className="text-xs text-[var(--text-dim)]">Attempts</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[var(--gold)] font-[family-name:var(--font-display)]">{formatPct(team.total_goals, team.total_attempts)}</p>
                  <p className="text-xs text-[var(--text-dim)]">Accuracy</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-[var(--gold)] px-2 py-0.5 text-xs font-black uppercase tracking-wide text-[var(--bg)] rounded-sm">
                  {team.wins}W-{team.draws}D-{team.losses}L
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {admin && teams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase">Manage Teams</h2>
          <TeamList teams={summaries} />
        </div>
      )}
    </div>
  );
}
