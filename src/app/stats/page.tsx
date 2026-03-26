import Link from 'next/link';
import { getDb, getAllStatTypes, getAllLeaderboards, getAllTeams, getQuarterLeaderboards } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import AddStatTypeForm from '@/components/AddStatTypeForm';
import StatTypeList from '@/components/StatTypeList';
import LeaderboardSection from '@/components/LeaderboardSection';
import QuarterLeaderboards from '@/components/QuarterLeaderboards';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const db = getDb();
  const admin = await isAdmin();
  const statTypes = getAllStatTypes(db);
  const teams = getAllTeams(db);
  const clubBoards = getAllLeaderboards(db);
  const sections = [
    { title: 'Club Leaderboards', ...clubBoards },
    ...teams.map(team => ({ title: team.name, ...getAllLeaderboards(db, team.id) })),
  ];
  const quarterBoards = getQuarterLeaderboards(db);

  return (
    <div className="space-y-8">
      <LeaderboardSection sections={sections} />

      {quarterBoards.length > 0 && <QuarterLeaderboards boards={quarterBoards} />}

      {sections.every(s => s.match.length === 0 && s.career.length === 0) && (
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
