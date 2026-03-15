'use client';

import { useTransition } from 'react';
import { restoreSession } from '@/actions/sessions';
import { restorePlayer } from '@/actions/players';
import { restoreTeam } from '@/actions/teams';
import type { Session, Player, Team } from '@/lib/db';

interface Props {
  sessions: Session[];
  players: Player[];
  teams: Team[];
}

export default function RecoveryPanel({ sessions, players, teams }: Props) {
  const [isPending, startTransition] = useTransition();

  const empty = sessions.length === 0 && players.length === 0 && teams.length === 0;

  if (empty) {
    return (
      <p className="text-sm text-stone-500">No deleted items to recover.</p>
    );
  }

  function handleRestore(type: 'session' | 'player' | 'team', id: number) {
    startTransition(async () => {
      try {
        if (type === 'session') await restoreSession(id);
        else if (type === 'player') await restorePlayer(id);
        else await restoreTeam(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to restore');
      }
    });
  }

  return (
    <div className="space-y-3">
      {teams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Teams</p>
          {teams.map(team => (
            <div key={team.id} className="flex items-center justify-between border border-stone-800 bg-[#111] rounded-lg px-4 py-3">
              <span className="text-stone-300">{team.name}</span>
              <button
                onClick={() => handleRestore('team', team.id)}
                disabled={isPending}
                className="text-xs font-bold text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {players.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Players</p>
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between border border-stone-800 bg-[#111] rounded-lg px-4 py-3">
              <div>
                <span className="text-stone-300">{player.name}</span>
                {player.team_name && <span className="text-xs text-stone-500 ml-2">{player.team_name}</span>}
              </div>
              <button
                onClick={() => handleRestore('player', player.id)}
                disabled={isPending}
                className="text-xs font-bold text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Matches</p>
          {sessions.map(session => (
            <div key={session.id} className="flex items-center justify-between border border-stone-800 bg-[#111] rounded-lg px-4 py-3">
              <div>
                <span className="text-stone-300">{session.name ?? 'Unnamed match'}</span>
                <span className="text-xs text-stone-500 ml-2">
                  {new Date(session.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <button
                onClick={() => handleRestore('session', session.id)}
                disabled={isPending}
                className="text-xs font-bold text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
