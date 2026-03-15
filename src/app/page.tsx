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
      <section className="border-2 border-yellow-400 rounded-lg bg-black p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-yellow-300 sm:text-3xl">{clubName}</h1>
            <p className="mt-1 text-sm text-stone-400">Track matches, players, and leaderboards.</p>
          </div>
          {creator && (
            <Link
              href="/sessions/new"
              className="flex-shrink-0 bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-black rounded-lg transition hover:bg-yellow-300 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              New Match
            </Link>
          )}
        </div>
      </section>

      {results.length === 0 ? (
        <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-stone-300">Welcome to {clubName}</h2>
          <p className="text-stone-500">Add some players and start your first match to see results here.</p>
          <div className="flex justify-center gap-4">
            <Link href="/players" className="bg-yellow-400 text-black font-bold rounded-lg px-5 py-2.5 hover:bg-yellow-300 transition-all">
              Add Players
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Matches</h2>
            <Link href="/sessions" className="text-sm text-yellow-300 hover:text-yellow-200">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {results.slice(0, 5).map(result => (
              <Link
                key={result.id}
                href={`/sessions/${result.id}/summary`}
                className="flex items-center justify-between border border-stone-800 bg-[#111] rounded-lg px-4 py-3 transition hover:border-yellow-400"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{result.name ?? 'Training Session'}</p>
                  <p className="text-xs text-stone-500">
                    {result.team_name} • {new Date(result.started_at).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-lg font-black text-white tabular-nums">
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
          </div>
        </section>
      )}
    </div>
  );
}
