import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb, getSessionWithStats, getAllStatTypes, getAllTeams } from '@/lib/db';
import { isAdmin, canEdit } from '@/lib/auth';
import RenameSessionForm from '@/components/RenameSessionForm';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import ReopenSessionButton from '@/components/ReopenSessionButton';
import SessionTeamForm from '@/components/SessionTeamForm';
import Breadcrumb from '@/components/Breadcrumb';

interface Props {
  params: Promise<{ id: string }>;
}

function pct(made: number, attempted: number) {
  if (attempted === 0) return '—';
  return `${Math.round((made / attempted) * 100)}%`;
}

function pctColor(made: number, attempted: number) {
  if (attempted === 0) return 'text-stone-500';
  const p = made / attempted;
  if (p >= 0.7) return 'text-yellow-300 font-bold';
  if (p >= 0.5) return 'text-amber-300 font-bold';
  return 'text-red-400 font-bold';
}

export default async function SessionSummaryPage({ params }: Props) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) notFound();

  const db = getDb();
  const data = getSessionWithStats(db, sessionId);
  if (!data) notFound();

  if (!data.session.ended_at) redirect(`/sessions/${sessionId}`);

  const { session, players } = data;
  const statTypes = getAllStatTypes(db);
  const teams = getAllTeams(db);
  const admin = await isAdmin();
  const editor = await canEdit();

  const homePlayers = players.filter(p => !p.is_opposition);
  const oppPlayers = players.filter(p => p.is_opposition);

  const teamMade = homePlayers.reduce((n, p) => n + p.made, 0);
  const teamAttempted = homePlayers.reduce((n, p) => n + p.attempted, 0);
  const oppShotScore = oppPlayers.reduce((n, p) => n + p.made, 0);
  const oppTotal = session.opposition_score + oppShotScore;

  const statTotals: Record<number, number> = {};
  for (const st of statTypes) {
    statTotals[st.id] = players.reduce((n, p) => n + (p.stat_counts[st.id] ?? 0), 0);
  }
  const activeStatTypes = statTypes.filter(st => statTotals[st.id] > 0);

  const showScore = teamMade > 0 || oppTotal > 0;
  const won = teamMade > oppTotal;
  const drew = teamMade === oppTotal;

  function renderPlayerTable(
    rows: typeof players,
    label: string,
    totalMade: number,
    totalAttempted: number,
  ) {
    if (rows.length === 0) return null;

    const sectionStatTotals: Record<number, number> = {};
    for (const st of activeStatTypes) {
      sectionStatTotals[st.id] = rows.reduce((n, p) => n + (p.stat_counts[st.id] ?? 0), 0);
    }

    return (
      <div className="rounded-lg border border-stone-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#111]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-stone-400 uppercase tracking-wide">Player</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">Made</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">Att</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">%</th>
              {activeStatTypes.map(st => (
                <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">
                  {st.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {rows.map(p => (
              <tr key={p.player_id} className="bg-black/30 hover:bg-[#111] transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${p.player_id}`}
                    className="font-medium text-stone-50 hover:text-yellow-300 transition-colors"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-yellow-300">{p.made}</td>
                <td className="px-4 py-3 text-right text-stone-300">{p.attempted}</td>
                <td className={`px-4 py-3 text-right ${pctColor(p.made, p.attempted)}`}>
                  {pct(p.made, p.attempted)}
                </td>
                {activeStatTypes.map(st => (
                  <td key={st.id} className="px-4 py-3 text-right text-yellow-300">
                    {p.stat_counts[st.id] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-[#111] font-semibold">
              <td className="px-4 py-3 text-stone-300">{label}</td>
              <td className="px-4 py-3 text-right text-yellow-300">{totalMade}</td>
              <td className="px-4 py-3 text-right text-stone-300">{totalAttempted}</td>
              <td className={`px-4 py-3 text-right ${pctColor(totalMade, totalAttempted)}`}>
                {pct(totalMade, totalAttempted)}
              </td>
              {activeStatTypes.map(st => (
                <td key={st.id} className="px-4 py-3 text-right text-yellow-300">
                  {sectionStatTotals[st.id]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Matches', href: '/sessions' },
        { label: session.name ?? 'Training Session' },
      ]} />

      <div className="flex items-start justify-between gap-3">
        <div>
          {admin ? (
            <div className="space-y-3">
              <RenameSessionForm sessionId={sessionId} currentName={session.name} />
              <SessionTeamForm sessionId={sessionId} currentTeamId={session.team_id} teams={teams} />
            </div>
          ) : (
            <h1 className="text-xl font-bold text-white">
              {session.name ?? 'Training Session'}
            </h1>
          )}
          <p className="mt-0.5 text-sm text-yellow-300">{session.team_name}</p>
          <p className="text-sm text-stone-500 mt-0.5">
            {new Date(session.started_at).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {admin && <DeleteSessionButton sessionId={sessionId} redirectTo="/sessions" />}
      </div>

      {showScore && (
        <div className="flex items-center justify-center gap-5 rounded-2xl border border-yellow-400/15 bg-black/55 py-4">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{session.team_name}</p>
            <p className={`text-4xl font-black tabular-nums ${won ? 'text-yellow-300' : drew ? 'text-stone-300' : 'text-white'}`}>{teamMade}</p>
          </div>
          <span className="text-2xl font-bold text-stone-700">:</span>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Opposition</p>
            <p className={`text-4xl font-black tabular-nums ${!won && !drew ? 'text-red-400' : 'text-white'}`}>{oppTotal}</p>
          </div>
          <p className={`text-sm font-bold uppercase tracking-wider ${won ? 'text-yellow-300' : drew ? 'text-stone-300' : 'text-red-400'}`}>
            {won ? 'Win' : drew ? 'Draw' : 'Loss'}
          </p>
        </div>
      )}

      {renderPlayerTable(
        homePlayers,
        'Total',
        teamMade,
        teamAttempted,
      )}

      {oppPlayers.length > 0 && (
        <>
          <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500">Opposition</h2>
          {renderPlayerTable(
            oppPlayers,
            'Total',
            oppPlayers.reduce((n, p) => n + p.made, 0),
            oppPlayers.reduce((n, p) => n + p.attempted, 0),
          )}
        </>
      )}

      <div className="flex gap-3">
        <Link
          href="/sessions"
          className="flex-1 rounded-lg border border-stone-800 py-3 text-center text-stone-200 transition-colors hover:bg-black/60"
        >
          View History
        </Link>
        {editor && <ReopenSessionButton sessionId={sessionId} />}
        <Link
          href="/sessions/new"
          className="flex-1 rounded-lg bg-yellow-400 py-3 text-center font-bold text-black transition-colors hover:bg-yellow-300"
        >
          New Match
        </Link>
      </div>
    </div>
  );
}
