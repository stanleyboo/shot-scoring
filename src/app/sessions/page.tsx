import Link from 'next/link';
import { getDb, getAllSessions } from '@/lib/db';
import DeleteSessionButton from '@/components/DeleteSessionButton';

export const dynamic = 'force-dynamic';

export default function SessionsPage() {
  const sessions = getAllSessions(getDb());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">History</h1>
        <Link
          href="/sessions/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          + New
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/20 p-12 text-center">
          <p className="text-slate-500 mb-3">No sessions yet.</p>
          <Link href="/sessions/new" className="text-indigo-400 hover:text-indigo-300 text-sm">
            Start your first session →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map(session => {
            const href = session.ended_at
              ? `/sessions/${session.id}/summary`
              : `/sessions/${session.id}`;
            return (
              <li
                key={session.id}
                className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 transition-colors"
              >
                <Link href={href} className="flex flex-1 items-center justify-between px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">
                        {session.name ?? 'Training Session'}
                      </span>
                      {!session.ended_at && (
                        <span className="rounded-full bg-green-900/60 px-2 py-0.5 text-xs font-medium text-green-400">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(session.started_at).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">{session.total_shots} shots</p>
                    <p className="text-xs text-slate-500">{session.player_count} players</p>
                  </div>
                </Link>
                <div className="pr-2">
                  <DeleteSessionButton sessionId={session.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
