import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDb, getAllPlayers, getAllTeams, getActiveSession } from '@/lib/db';
import { canCreate } from '@/lib/auth';
import NewSessionForm from '@/components/NewSessionForm';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  const creator = await canCreate();
  if (!creator) redirect('/sessions');

  const db = getDb();
  const active = getActiveSession(db);
  if (active) redirect(`/sessions/${active.id}`);

  const players = getAllPlayers(db);
  const teams = getAllTeams(db);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)] uppercase">New Match</h1>
          <p className="text-sm text-[var(--text-muted)]">Choose a team and line-up before scoring starts.</p>
        </div>
      </div>
      <NewSessionForm players={players} teams={teams} />
    </div>
  );
}
