import Link from 'next/link';
import { getDb, getAllStatTypes, getAllLeaderboards, getAllTeams, getQuarterLeaderboards } from '@/lib/db';
import { redirect } from 'next/navigation';
import { isAdmin, getSettings, canViewPage } from '@/lib/auth';
import AddStatTypeForm from '@/components/AddStatTypeForm';
import StatTypeList from '@/components/StatTypeList';
import StatsView from '@/components/StatsView';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  if (!(await canViewPage(getSettings().page_stats))) redirect('/');
  const db = getDb();
  const admin = await isAdmin();
  const statTypes = getAllStatTypes(db);
  const teams = getAllTeams(db);

  const clubBoards = getAllLeaderboards(db);
  const clubQuarterBoards = getQuarterLeaderboards(db);

  const teamData = teams.map(team => ({
    id: team.id,
    name: team.name,
    ...getAllLeaderboards(db, team.id),
    quarterBoards: getQuarterLeaderboards(db, team.id),
  }));

  const hasData = clubBoards.match.length > 0 || clubBoards.career.length > 0 || clubQuarterBoards.length > 0;

  return (
    <div className="space-y-8">
      {hasData ? (
        <StatsView
          clubMatch={clubBoards.match}
          clubCareer={clubBoards.career}
          clubQuarter={clubQuarterBoards}
          teams={teamData}
        />
      ) : (
        <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-12 text-center">
          <p className="text-[var(--text-muted)]">Play some matches to see leaderboards.</p>
          <Link href="/sessions/new" className="mt-3 inline-block text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
            Start a match →
          </Link>
        </div>
      )}

      {admin && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">Manage Stat Types</h2>
          <AddStatTypeForm />
          <StatTypeList statTypes={statTypes} />
        </div>
      )}
    </div>
  );
}
