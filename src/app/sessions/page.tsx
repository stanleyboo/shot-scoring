import Link from 'next/link';
import { getDb, getAllSessions, getAllTeams } from '@/lib/db';
import ExportAllButton from '@/components/ExportAllButton';
import SessionListPage from '@/components/SessionListPage';

export const dynamic = 'force-dynamic';

export default function SessionsPage() {
  const db = getDb();
  const sessions = getAllSessions(db);
  const teams = getAllTeams(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-yellow-300">Match History</h1>
          <p className="text-sm text-stone-400">Every match grouped by team.</p>
        </div>
        <div className="flex gap-2">
          {sessions.length > 0 && <ExportAllButton />}
          <Link
            href="/sessions/new"
            className="bg-yellow-400 rounded-lg px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            + New Match
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-12 text-center">
          <p className="mb-3 text-stone-400">No matches yet.</p>
          <Link href="/sessions/new" className="text-sm text-yellow-300 hover:text-yellow-200">
            Start your first match →
          </Link>
        </div>
      ) : (
        <SessionListPage sessions={sessions} teams={teams} />
      )}
    </div>
  );
}
