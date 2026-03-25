'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchInput from './SearchInput';
import DeleteSessionButton from './DeleteSessionButton';
import type { Session, Team } from '@/lib/db';

type SessionRow = Session & { total_shots: number; player_count: number; home_score: number; opp_score: number };

interface Props {
  sessions: SessionRow[];
  teams: Team[];
  isAdmin?: boolean;
}

export default function SessionListPage({ sessions, teams, isAdmin: admin }: Props) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const filtered = sessions.filter(s => {
    if (search && !(s.name ?? 'Training Session').toLowerCase().includes(search.toLowerCase())) return false;
    if (teamFilter && s.team_id !== Number(teamFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search matches..."
          />
        </div>
        {teams.length > 1 && (
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="bg-white/25 backdrop-blur-sm border border-[var(--border)] rounded px-4 py-3 text-[var(--text)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30"
          >
            <option value="">All teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-8">
        {teams.map(team => {
          const teamSessions = filtered.filter(s => s.team_id === team.id);
          if (teamSessions.length === 0) return null;

          return (
            <section key={team.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">{team.name}</h2>
                <Link href={`/teams/${team.id}`} className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
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
                      className="flex items-center gap-1 border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded transition hover:border-[var(--gold)] gold-glow"
                    >
                      <Link href={href} className="flex flex-1 items-center justify-between px-4 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--text)]">
                              {session.name ?? 'Training Session'}
                            </span>
                            {!session.ended_at && (
                              <span className="bg-[var(--gold)] px-2 py-0.5 text-xs font-black uppercase tracking-wide text-[var(--bg)]">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-[var(--text-dim)]">
                            {new Date(session.started_at).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          {(session.home_score > 0 || session.opp_score > 0) ? (
                            <p className="text-lg font-black tabular-nums font-[family-name:var(--font-display)]">
                              <span className={session.home_score > session.opp_score ? 'text-[var(--gold)]' : 'text-[var(--text)]'}>{session.home_score}</span>
                              <span className="text-[var(--text-dim)] mx-0.5">-</span>
                              <span className={session.opp_score > session.home_score ? 'text-[var(--red)]' : 'text-[var(--text)]'}>{session.opp_score}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-[var(--text-muted)]">{session.total_shots} shots</p>
                          )}
                          <p className="text-xs text-[var(--text-dim)]">{session.player_count} players</p>
                        </div>
                      </Link>
                      {admin && (
                        <div className="pr-2">
                          <DeleteSessionButton sessionId={session.id} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-8 text-center">
          <p className="text-[var(--text-muted)]">No matches found.</p>
        </div>
      )}
    </div>
  );
}
