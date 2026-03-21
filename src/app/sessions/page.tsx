import Link from 'next/link';
import { getDb, getAllSessions, getAllTeams } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import ExportAllButton from '@/components/ExportAllButton';
import SessionListPage from '@/components/SessionListPage';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const db = getDb();
  const sessions = getAllSessions(db);
  const teams = getAllTeams(db);
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Match History</h1>
          <p className="text-sm text-[var(--text-muted)]">Every match grouped by team.</p>
        </div>
        <div className="flex gap-2">
          {sessions.length > 0 && <ExportAllButton />}
          <Link
            href="/sessions/new"
            className="bg-[var(--gold)] rounded px-4 py-2 text-sm font-bold text-black transition hover:bg-[var(--gold-hover)]"
          >
            + New Match
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-dashed border-[var(--gold)]/30 bg-[var(--surface)] rounded p-12 text-center">
          <p className="mb-3 text-[var(--text-muted)]">No matches yet.</p>
          <Link href="/sessions/new" className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
            Start your first match →
          </Link>
        </div>
      ) : (
        <SessionListPage sessions={sessions} teams={teams} isAdmin={admin} />
      )}
    </div>
  );
}
