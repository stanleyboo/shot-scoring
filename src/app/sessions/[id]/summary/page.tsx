import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb, getSessionWithStats, getAllStatTypes, getAllTeams, getAllPlayers, getSessionQuarterBreakdown, getPlayerQuarterBreakdown, getPlayerQuartersPlayed } from '@/lib/db';
import { isAdmin, canEditEnded } from '@/lib/auth';
import RenameSessionForm from '@/components/RenameSessionForm';
import DeleteSessionButton from '@/components/DeleteSessionButton';
import ReopenSessionButton from '@/components/ReopenSessionButton';
import SessionTeamForm from '@/components/SessionTeamForm';
import Breadcrumb from '@/components/Breadcrumb';
import ExportButton from '@/components/ExportButton';
import RemovePlayerButton from '@/components/RemovePlayerButton';
import AddPlayerToSession from '@/components/AddPlayerToSession';

interface Props {
  params: Promise<{ id: string }>;
}

function pct(made: number, attempted: number) {
  if (attempted === 0) return '—';
  return `${Math.round((made / attempted) * 100)}%`;
}

function pctColor(made: number, attempted: number) {
  if (attempted === 0) return 'text-[var(--text-dim)]';
  const p = made / attempted;
  if (p >= 0.7) return 'text-[var(--gold)] font-bold';
  if (p >= 0.5) return 'text-amber-300 font-bold';
  return 'text-[var(--red)] font-bold';
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
  const quartersPlayedMap = getPlayerQuartersPlayed(db, sessionId);
  const admin = await isAdmin();
  const editor = await canEditEnded();

  const allPlayers = getAllPlayers(db);
  const playerIdsInSession = new Set(players.map(p => p.player_id));
  const availablePlayers = allPlayers.filter(p => !playerIdsInSession.has(p.id));

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

  const anyPositions = homePlayers.some(p => p.position);
  const anyQuarters = Array.from(quartersPlayedMap.values()).some(q => q.length > 0);

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

    const showPos = rows.some(p => p.position);
    const showQtrs = rows.some(p => (quartersPlayedMap.get(p.player_id)?.length ?? 0) > 0);

    return (
      <div className="rounded border border-[var(--border)] overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/25 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Player</th>
              {showPos && <th className="px-3 py-3 text-center text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Pos</th>}
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Made</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Att</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">%</th>
              {showQtrs && <th className="px-3 py-3 text-center text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Qtrs</th>}
              {showQtrs && <th className="px-3 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">G/Qtr</th>}
              {activeStatTypes.map(st => (
                <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  {st.name}
                </th>
              ))}
              {admin && <th className="px-2 py-3 w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((p, i) => {
              const qp = quartersPlayedMap.get(p.player_id) ?? [];
              const gpq = qp.length > 0 ? (p.made / qp.length).toFixed(1) : null;
              return (
                <tr key={p.player_id} className={`${i % 2 === 0 ? 'bg-white/20' : 'bg-white/15'} hover:bg-white/25 backdrop-blur-sm transition-colors`}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/players/${p.player_id}`}
                      className="font-medium text-[var(--text)] hover:text-[var(--gold)] transition-colors"
                    >
                      {p.name}
                    </Link>
                  </td>
                  {showPos && (
                    <td className="px-3 py-3 text-center">
                      {p.position ? (
                        <span className="bg-[var(--gold)]/15 text-[var(--gold)] px-2 py-0.5 text-xs font-bold rounded">{p.position}</span>
                      ) : (
                        <span className="text-[var(--text-dim)]">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-[var(--gold)]">{p.made}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-muted)]">{p.attempted}</td>
                  <td className={`px-4 py-3 text-right ${pctColor(p.made, p.attempted)}`}>
                    {pct(p.made, p.attempted)}
                  </td>
                  {showQtrs && (
                    <td className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                      {qp.length > 0 ? qp.join(',') : '—'}
                    </td>
                  )}
                  {showQtrs && (
                    <td className="px-3 py-3 text-right font-semibold text-[var(--gold)]">
                      {gpq ?? '—'}
                    </td>
                  )}
                  {activeStatTypes.map(st => (
                    <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">
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
              );
            })}
            <tr className="bg-white/25 backdrop-blur-sm font-semibold">
              <td className="px-4 py-3 text-[var(--text-muted)]">{label}</td>
              {showPos && <td />}
              <td className="px-4 py-3 text-right text-[var(--gold)]">{totalMade}</td>
              <td className="px-4 py-3 text-right text-[var(--text-muted)]">{totalAttempted}</td>
              <td className={`px-4 py-3 text-right ${pctColor(totalMade, totalAttempted)}`}>
                {pct(totalMade, totalAttempted)}
              </td>
              {showQtrs && <td />}
              {showQtrs && <td />}
              {activeStatTypes.map(st => (
                <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">
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
            <h1 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">
              {session.name ?? 'Training Session'}
            </h1>
          )}
          <p className="mt-0.5 text-sm text-[var(--gold)]">{session.team_name}</p>
          <p className="text-sm text-[var(--text-dim)] mt-0.5">
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
        <div className="flex items-center justify-center gap-5 rounded border border-[var(--border-gold)] bg-white/25 backdrop-blur-sm py-4">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-dim)]">{session.team_name}</p>
            <p className={`text-4xl font-black tabular-nums font-[family-name:var(--font-display)] ${won ? 'text-[var(--gold)]' : drew ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>{teamMade}</p>
          </div>
          <span className="text-2xl font-bold text-[var(--text-dim)]">:</span>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-dim)]">Opposition</p>
            <p className={`text-4xl font-black tabular-nums font-[family-name:var(--font-display)] ${!won && !drew ? 'text-[var(--red)]' : 'text-[var(--text)]'}`}>{oppTotal}</p>
          </div>
          <p className={`text-sm font-bold uppercase tracking-wider ${won ? 'text-[var(--gold)]' : drew ? 'text-[var(--text-muted)]' : 'text-[var(--red)]'}`}>
            {won ? 'Win' : drew ? 'Draw' : 'Loss'}
          </p>
        </div>
      )}

      {/* === SECTION 1: Player Stats === */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--gold)] font-[family-name:var(--font-display)] flex items-center gap-2">
          <span className="h-px flex-1 bg-[var(--gold)]/30" />
          Player Stats
          <span className="h-px flex-1 bg-[var(--gold)]/30" />
        </h2>
        {renderPlayerTable(
          homePlayers,
          'Total',
          teamMade,
          teamAttempted,
        )}
      </div>

      {/* === SECTION 2: Player Stats Per Quarter === */}
      {quarters.length > 1 && playerQuarters.length > 0 && (() => {
        const homePlayerQuarters = playerQuarters.filter(pq => !oppPlayers.some(op => op.player_id === pq.player_id));
        const playerIds = [...new Set(homePlayerQuarters.map(pq => pq.player_id))];
        const qNums = [...new Set(homePlayerQuarters.map(pq => pq.quarter))].sort();
        if (playerIds.length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--gold)] font-[family-name:var(--font-display)] flex items-center gap-2">
              <span className="h-px flex-1 bg-[var(--gold)]/30" />
              Player Stats Per Quarter
              <span className="h-px flex-1 bg-[var(--gold)]/30" />
            </h2>
            <div className="rounded border border-[var(--border)] overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/25 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Player</th>
                    {qNums.map(q => (
                      <th key={`q${q}-h`} colSpan={2 + activeStatTypes.length} className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide border-l border-[var(--border)]">
                        Q{q}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-3 py-2" />
                    {qNums.map(q => (
                      <React.Fragment key={`sub-${q}`}>
                        <th className="px-3 py-2 text-right text-xs text-[var(--text-dim)] border-l border-[var(--border)]">Goals</th>
                        <th className="px-3 py-2 text-right text-xs text-[var(--text-dim)]">%</th>
                        {activeStatTypes.map(st => (
                          <th key={`${q}-${st.id}`} className="px-3 py-2 text-right text-xs text-[var(--text-dim)]">{st.name}</th>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {playerIds.map((pid, i) => {
                    const pRows = homePlayerQuarters.filter(pq => pq.player_id === pid);
                    const playerName = pRows[0]?.name ?? '';
                    return (
                      <tr key={pid} className={`${i % 2 === 0 ? 'bg-white/20' : 'bg-white/15'} hover:bg-white/25 backdrop-blur-sm transition-colors`}>
                        <td className="px-4 py-3">
                          <Link href={`/players/${pid}`} className="font-medium text-[var(--text)] hover:text-[var(--gold)] transition-colors">
                            {playerName}
                          </Link>
                        </td>
                        {qNums.map(q => {
                          const qData = pRows.find(r => r.quarter === q);
                          return (
                            <React.Fragment key={`${pid}-${q}`}>
                              <td className="px-3 py-3 text-right border-l border-[var(--border)]">
                                {qData ? (
                                  <>
                                    <span className="text-[var(--gold)]">{qData.made}</span>
                                    {qData.attempted > 0 && (
                                      <span className="text-[var(--text-dim)] text-xs ml-1">/{qData.attempted}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[var(--text-dim)]">-</span>
                                )}
                              </td>
                              <td className={`px-3 py-3 text-right ${qData ? pctColor(qData.made, qData.attempted) : 'text-[var(--text-dim)]'}`}>
                                {qData ? pct(qData.made, qData.attempted) : '-'}
                              </td>
                              {activeStatTypes.map(st => (
                                <td key={`${pid}-${q}-${st.id}`} className="px-3 py-3 text-right text-[var(--gold)]">
                                  {qData ? (qData.stat_counts[st.id] ?? 0) : <span className="text-[var(--text-dim)]">-</span>}
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

      {/* === SECTION 3: Team Stats === */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--gold)] font-[family-name:var(--font-display)] flex items-center gap-2">
          <span className="h-px flex-1 bg-[var(--gold)]/30" />
          Team Stats
          <span className="h-px flex-1 bg-[var(--gold)]/30" />
        </h2>
        <div className="rounded border border-[var(--border)] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/25 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Team</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Goals</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Att</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">%</th>
                {activeStatTypes.map(st => (
                  <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    {st.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr className="bg-white/20">
                <td className="px-4 py-3 font-medium text-[var(--gold)]">{session.team_name}</td>
                <td className="px-4 py-3 text-right text-[var(--gold)] font-bold">{teamMade}</td>
                <td className="px-4 py-3 text-right text-[var(--text-muted)]">{teamAttempted}</td>
                <td className={`px-4 py-3 text-right ${pctColor(teamMade, teamAttempted)}`}>{pct(teamMade, teamAttempted)}</td>
                {activeStatTypes.map(st => {
                  const homeTotal = homePlayers.reduce((n, p) => n + (p.stat_counts[st.id] ?? 0), 0);
                  return <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">{homeTotal}</td>;
                })}
              </tr>
              <tr className="bg-white/15">
                <td className="px-4 py-3 font-medium text-[var(--text-muted)]">Opposition</td>
                <td className="px-4 py-3 text-right text-[var(--text)] font-bold">{oppTotal}</td>
                <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                  {session.opposition_attempted + oppPlayers.reduce((n, p) => n + p.attempted, 0)}
                </td>
                <td className={`px-4 py-3 text-right ${pctColor(oppTotal, session.opposition_attempted + oppPlayers.reduce((n, p) => n + p.attempted, 0))}`}>
                  {pct(oppTotal, session.opposition_attempted + oppPlayers.reduce((n, p) => n + p.attempted, 0))}
                </td>
                {activeStatTypes.map(st => {
                  const oppStatTotal = oppPlayers.reduce((n, p) => n + (p.stat_counts[st.id] ?? 0), 0);
                  return <td key={st.id} className="px-4 py-3 text-right text-[var(--text-muted)]">{oppStatTotal}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* === SECTION 4: Team Stats Per Quarter === */}
      {quarters.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--gold)] font-[family-name:var(--font-display)] flex items-center gap-2">
            <span className="h-px flex-1 bg-[var(--gold)]/30" />
            Team Stats Per Quarter
            <span className="h-px flex-1 bg-[var(--gold)]/30" />
          </h2>
          <div className="rounded border border-[var(--border)] overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/25 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Quarter</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">{session.team_name}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">Opp</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">%</th>
                  {activeStatTypes.map(st => (
                    <th key={st.id} className="px-4 py-3 text-right text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
                      {st.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {quarters.map((q, i) => (
                  <tr key={q.quarter} className={i % 2 === 0 ? 'bg-white/20' : 'bg-white/15'}>
                    <td className="px-4 py-3 font-medium text-[var(--text-muted)]">Q{q.quarter}</td>
                    <td className="px-4 py-3 text-right text-[var(--gold)]">{q.home_made}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">{q.opp_made}</td>
                    <td className={`px-4 py-3 text-right ${pctColor(q.home_made, q.home_attempted)}`}>
                      {pct(q.home_made, q.home_attempted)}
                    </td>
                    {activeStatTypes.map(st => (
                      <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">
                        {q.stat_counts[st.id] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-white/25 backdrop-blur-sm font-semibold">
                  <td className="px-4 py-3 text-[var(--text-muted)]">Total</td>
                  <td className="px-4 py-3 text-right text-[var(--gold)]">{teamMade}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-muted)]">{oppTotal}</td>
                  <td className={`px-4 py-3 text-right ${pctColor(teamMade, teamAttempted)}`}>
                    {pct(teamMade, teamAttempted)}
                  </td>
                  {activeStatTypes.map(st => (
                    <td key={st.id} className="px-4 py-3 text-right text-[var(--gold)]">
                      {quarters.reduce((n, q) => n + (q.stat_counts[st.id] ?? 0), 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Opposition Players === */}
      {oppPlayers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--red)] font-[family-name:var(--font-display)] flex items-center gap-2">
            <span className="h-px flex-1 bg-[var(--red)]/30" />
            Opposition
            <span className="h-px flex-1 bg-[var(--red)]/30" />
          </h2>
          {renderPlayerTable(
            oppPlayers,
            'Total',
            oppPlayers.reduce((n, p) => n + p.made, 0),
            oppPlayers.reduce((n, p) => n + p.attempted, 0),
          )}
        </div>
      )}

      <div className="flex gap-3">
        <ExportButton
          sessionId={sessionId}
          sessionName={session.name}
          sessionDate={session.started_at}
        />
        <Link
          href="/sessions"
          className="flex-1 rounded border border-[var(--border)] py-3 text-center text-[var(--text-muted)] transition-colors hover:bg-white/25 backdrop-blur-sm"
        >
          View History
        </Link>
        {editor && <ReopenSessionButton sessionId={sessionId} />}
        {editor && <AddPlayerToSession sessionId={sessionId} availablePlayers={availablePlayers} />}
        <Link
          href="/sessions/new"
          className="flex-1 rounded bg-[var(--gold)] py-3 text-center font-bold text-[var(--bg)] transition-colors hover:bg-[var(--gold-hover)]"
        >
          New Match
        </Link>
      </div>
    </div>
  );
}
