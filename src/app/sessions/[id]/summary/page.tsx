import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb, getSessionWithStats, getAllStatTypes, getAllTeams, getSessionQuarterBreakdown, getPlayerQuarterBreakdown } from '@/lib/db';
import { isAdmin, canEdit } from '@/lib/auth';
import RenameSessionForm from '@/components/RenameSessionForm';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import ReopenSessionButton from '@/components/ReopenSessionButton';
import SessionTeamForm from '@/components/SessionTeamForm';
import Breadcrumb from '@/components/Breadcrumb';
import ExportButton from '@/components/ExportButton';
import RemovePlayerButton from '@/components/RemovePlayerButton';

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
  const statTypes = getAllStatTypes(db, true);
  const teams = getAllTeams(db);
  const quarters = getSessionQuarterBreakdown(db, sessionId);
  const playerQuarters = getPlayerQuarterBreakdown(db, sessionId);
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
              {admin && <th className="px-2 py-3 w-8" />}
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
                {admin && (
                  <td className="px-2 py-3 text-center">
                    <RemovePlayerButton
                      sessionId={sessionId}
                      playerId={p.player_id}
                      playerName={p.name}
                    />
                  </td>
                )}
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
              {admin && <td />}
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

      {quarters.length > 1 && (
        <div className="rounded-lg border border-stone-800 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-400 uppercase tracking-wide">Quarter</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">{session.team_name}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">Opp</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">%</th>
                {activeStatTypes.map(st => (
                  <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-stone-400 uppercase tracking-wide">
                    {st.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {quarters.map(q => (
                <tr key={q.quarter} className="bg-black/30">
                  <td className="px-4 py-3 font-medium text-stone-300">Q{q.quarter}</td>
                  <td className="px-4 py-3 text-right text-yellow-300">{q.home_made}</td>
                  <td className="px-4 py-3 text-right text-stone-300">{q.opp_made}</td>
                  <td className={`px-4 py-3 text-right ${pctColor(q.home_made, q.home_attempted)}`}>
                    {pct(q.home_made, q.home_attempted)}
                  </td>
                  {activeStatTypes.map(st => (
                    <td key={st.id} className="px-4 py-3 text-right text-yellow-300">
                      {q.stat_counts[st.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-[#111] font-semibold">
                <td className="px-4 py-3 text-stone-300">Total</td>
                <td className="px-4 py-3 text-right text-yellow-300">{teamMade}</td>
                <td className="px-4 py-3 text-right text-stone-300">{oppTotal}</td>
                <td className={`px-4 py-3 text-right ${pctColor(teamMade, teamAttempted)}`}>
                  {pct(teamMade, teamAttempted)}
                </td>
                {activeStatTypes.map(st => (
                  <td key={st.id} className="px-4 py-3 text-right text-yellow-300">
                    {quarters.reduce((n, q) => n + (q.stat_counts[st.id] ?? 0), 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {renderPlayerTable(
        homePlayers,
        'Total',
        teamMade,
        teamAttempted,
      )}

      {quarters.length > 1 && playerQuarters.length > 0 && (() => {
        const playerIds = [...new Set(playerQuarters.map(pq => pq.player_id))];
        const qNums = [...new Set(playerQuarters.map(pq => pq.quarter))].sort();
        return (
          <div className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500">Per Quarter</h2>
            <div className="rounded-lg border border-stone-800 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-400 uppercase tracking-wide">Player</th>
                    {qNums.map(q => (
                      <th key={`q${q}-h`} colSpan={2 + activeStatTypes.length} className="px-4 py-3 text-center text-sm font-medium text-stone-400 uppercase tracking-wide border-l border-stone-800">
                        Q{q}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-3 py-2" />
                    {qNums.map(q => (
                      <React.Fragment key={`sub-${q}`}>
                        <th className="px-3 py-2 text-right text-xs text-stone-500 border-l border-stone-800">Goals</th>
                        <th className="px-3 py-2 text-right text-xs text-stone-500">%</th>
                        {activeStatTypes.map(st => (
                          <th key={`${q}-${st.id}`} className="px-3 py-2 text-right text-xs text-stone-500">{st.name}</th>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {playerIds.map(pid => {
                    const pRows = playerQuarters.filter(pq => pq.player_id === pid);
                    const playerName = pRows[0]?.name ?? '';
                    return (
                      <tr key={pid} className="bg-black/30 hover:bg-[#111] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/players/${pid}`} className="font-medium text-stone-50 hover:text-yellow-300 transition-colors">
                            {playerName}
                          </Link>
                        </td>
                        {qNums.map(q => {
                          const qData = pRows.find(r => r.quarter === q);
                          return (
                            <React.Fragment key={`${pid}-${q}`}>
                              <td className="px-3 py-3 text-right border-l border-stone-800">
                                {qData ? (
                                  <>
                                    <span className="text-yellow-300">{qData.made}</span>
                                    {qData.attempted > 0 && (
                                      <span className="text-stone-500 text-xs ml-1">/{qData.attempted}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-stone-700">-</span>
                                )}
                              </td>
                              <td className={`px-3 py-3 text-right ${qData ? pctColor(qData.made, qData.attempted) : 'text-stone-700'}`}>
                                {qData ? pct(qData.made, qData.attempted) : '-'}
                              </td>
                              {activeStatTypes.map(st => (
                                <td key={`${pid}-${q}-${st.id}`} className="px-3 py-3 text-right text-yellow-300">
                                  {qData ? (qData.stat_counts[st.id] ?? 0) : <span className="text-stone-700">-</span>}
                                </td>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
        <ExportButton
          sessionId={sessionId}
          sessionName={session.name}
          sessionDate={session.started_at}
        />
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
