import Link from 'next/link';
import { getDb, getAllTeams, getTeamSummaries } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import AddTeamForm from '@/components/AddTeamForm';
import TeamList from '@/components/TeamList';

export const dynamic = 'force-dynamic';

function formatPct(goals: number, attempts: number) {
  if (attempts === 0) return '—';
  return `${Math.round((goals / attempts) * 100)}%`;
}

export default async function TeamsPage() {
  const db = getDb();
  const admin = await isAdmin();
  const teams = getAllTeams(db);
  const summaries = getTeamSummaries(db);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-yellow-300">Teams</h1>
        <p className="text-sm text-stone-400">Manage squads and view team stats.</p>
      </div>

      {admin && <AddTeamForm />}

      {teams.length === 0 ? (
        <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-12 text-center">
          <p className="text-stone-400">No teams yet. Add one above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="border border-stone-800 bg-[#111] rounded-lg p-5 transition hover:border-yellow-400"
            >
              <h3 className="text-xl font-bold text-yellow-300">{team.name}</h3>
              <p className="mt-1 text-sm text-stone-400">
                {team.player_count} players, {team.session_count} matches
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
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
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-yellow-400 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-black rounded">
                  {team.wins}W-{team.draws}D-{team.losses}L
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {admin && teams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-stone-300">Manage Teams</h2>
          <TeamList teams={summaries} />
        </div>
      )}
    </div>
  );
}
