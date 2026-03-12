'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchInput from './SearchInput';
import DeleteSessionButton from './DeleteSessionButton';
import type { Session, Team } from '@/lib/db';

type SessionRow = Session & { total_shots: number; player_count: number };

interface Props {
  sessions: SessionRow[];
  teams: Team[];
}

export default function SessionListPage({ sessions, teams }: Props) {
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
            className="bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
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
                      className="flex items-center gap-1 border border-stone-800 bg-[#111] rounded-lg transition hover:border-yellow-400"
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

      {filtered.length === 0 && search && (
        <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-8 text-center">
          <p className="text-stone-400">No matches found.</p>
        </div>
      )}
    </div>
  );
}
