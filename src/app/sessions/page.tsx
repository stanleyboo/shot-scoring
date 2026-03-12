import Link from 'next/link';
import { getDb, getAllSessions, getAllTeams } from '@/lib/db';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import ExportAllButton from '@/components/ExportAllButton';

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
          <p className="text-sm text-stone-400">Every match grouped by Langwith team.</p>
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
        <div className="border-2 border-stone-900 bg-black p-12 text-center">
          <p className="mb-3 text-stone-400">No matches yet.</p>
          <Link href="/sessions/new" className="text-sm text-yellow-300 hover:text-yellow-200">
            Start your first match →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {teams.map(team => {
            const teamSessions = sessions.filter(session => session.team_id === team.id);
            if (teamSessions.length === 0) return null;

            return (
              <section key={team.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{team.name}</h2>
                  <Link href={`/teams/${team.id}`} className="text-sm text-yellow-300 hover:text-yellow-200">
                    Team dashboard →
                  </Link>
                </div>

                <ul className="space-y-2">
                  {teamSessions.map(session => {
                    const href = session.ended_at
                      ? `/sessions/${session.id}/summary`
                      : `/sessions/${session.id}`;

                    return (
                      <li
                        key={session.id}
                        className="flex items-center gap-1 border-2 border-stone-900 bg-[#111111] transition hover:border-yellow-400 hover:bg-black"
                      >
                        <Link href={href} className="flex flex-1 items-center justify-between px-4 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {session.name ?? 'Training Session'}
                              </span>
                              {!session.ended_at && (
                                <span className="bg-yellow-400 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-black">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-stone-500">
                              {new Date(session.started_at).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-stone-200">{session.total_shots} shots</p>
                            <p className="text-xs text-stone-500">{session.player_count} players</p>
                          </div>
                        </Link>
                        <div className="pr-2">
                          <DeleteSessionButton sessionId={session.id} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
