import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  getDb,
  getActiveSession,
  getMatchResults,
  getSetting,
} from '@/lib/db';
import { canCreate, canEdit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const active = getActiveSession(db);
  if (active) {
    const editor = await canEdit();
    if (editor) redirect(`/sessions/${active.id}`);
    redirect('/sessions');
  }

  const creator = await canCreate();
  const clubName = getSetting(db, 'club_name') ?? 'Langwith Netball';
  const results = getMatchResults(db);

  return (
    <div className="space-y-6">
      <section className="border-2 border-[var(--gold)] rounded bg-white/25 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--gold)] sm:text-3xl font-[family-name:var(--font-display)] uppercase">{clubName}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Track matches, players, and leaderboards.</p>
          </div>
          {creator && (
            <Link
              href="/sessions/new"
              className="flex-shrink-0 bg-[var(--gold)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--bg)] rounded transition hover:bg-[var(--gold-hover)] sm:px-5 sm:py-2.5 sm:text-sm"
            >
              New Match
            </Link>
          )}
        </div>
      </section>

      {results.length === 0 ? (
        <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase">Welcome to {clubName}</h2>
          <p className="text-[var(--text-dim)]">Add some players and start your first match to see results here.</p>
          <div className="flex justify-center gap-4">
            <Link href="/players" className="bg-[var(--gold)] text-[var(--bg)] font-bold rounded px-5 py-2.5 hover:bg-[var(--gold-hover)] transition-all">
              Add Players
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Recent Matches</h2>
            <Link href="/sessions" className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {results.slice(0, 5).map(result => (
              <Link
                key={result.id}
                href={`/sessions/${result.id}/summary`}
                className="flex items-center justify-between border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded px-4 py-3 transition hover:border-[var(--gold)] gold-glow"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text)] truncate">{result.name ?? 'Training Session'}</p>
                  <p className="text-xs text-[var(--text-dim)]">
                    {result.team_name} • {new Date(result.started_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-lg font-black text-[var(--text)] tabular-nums font-[family-name:var(--font-display)]">
                    {result.home} : {result.opp}
                  </p>
                  <p className={`text-xs font-bold ${
                    result.outcome === 'W' ? 'text-[var(--gold)]' : result.outcome === 'D' ? 'text-[var(--text-muted)]' : 'text-[var(--red)]'
                  }`}>
                    {result.outcome}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
