import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb, getSessionWithStats } from '@/lib/db';
import RenameSessionForm from '@/components/RenameSessionForm';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import ReopenSessionButton from '@/components/ReopenSessionButton';

interface Props {
  params: Promise<{ id: string }>;
}

function pct(made: number, attempted: number) {
  if (attempted === 0) return '—';
  return `${Math.round((made / attempted) * 100)}%`;
}

function pctColor(made: number, attempted: number) {
  if (attempted === 0) return 'text-slate-500';
  const p = made / attempted;
  if (p >= 0.7) return 'text-green-400 font-bold';
  if (p >= 0.5) return 'text-yellow-400 font-bold';
  return 'text-red-400 font-bold';
}

export default async function SessionSummaryPage({ params }: Props) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) notFound();

  const data = getSessionWithStats(getDb(), sessionId);
  if (!data) notFound();

  // Session still live — go to the scoring board
  if (!data.session.ended_at) redirect(`/sessions/${sessionId}`);

  const { session, players } = data;
  const totalMade = players.reduce((n, p) => n + p.made, 0);
  const totalAttempted = players.reduce((n, p) => n + p.attempted, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/sessions" className="mt-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            ←
          </Link>
          <div>
            <RenameSessionForm sessionId={sessionId} currentName={session.name} />
            <p className="text-sm text-slate-500 mt-0.5">
              {new Date(session.started_at).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <DeleteSessionButton sessionId={sessionId} redirectTo="/sessions" />
      </div>

      <div className="rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Player</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Made</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Attempted</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {players.map(p => (
              <tr key={p.player_id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${p.player_id}`}
                    className="font-medium text-slate-100 hover:text-indigo-400 transition-colors"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-green-400">{p.made}</td>
                <td className="px-4 py-3 text-right text-slate-300">{p.attempted}</td>
                <td className={`px-4 py-3 text-right ${pctColor(p.made, p.attempted)}`}>
                  {pct(p.made, p.attempted)}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-800/80 font-semibold">
              <td className="px-4 py-3 text-slate-300">Total</td>
              <td className="px-4 py-3 text-right text-green-400">{totalMade}</td>
              <td className="px-4 py-3 text-right text-slate-300">{totalAttempted}</td>
              <td className={`px-4 py-3 text-right ${pctColor(totalMade, totalAttempted)}`}>
                {pct(totalMade, totalAttempted)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Link
          href="/sessions"
          className="flex-1 rounded-xl border border-slate-700 py-3 text-center text-slate-300 hover:bg-slate-800 transition-colors"
        >
          View History
        </Link>
        <ReopenSessionButton sessionId={sessionId} />
        <Link
          href="/sessions/new"
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-center font-bold text-white hover:bg-indigo-500 transition-colors"
        >
          New Session
        </Link>
      </div>
    </div>
  );
}
