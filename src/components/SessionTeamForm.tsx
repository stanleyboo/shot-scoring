'use client';

import { useTransition } from 'react';
import { changeSessionTeam } from '@/actions/sessions';
import type { Team } from '@/lib/db';

export default function SessionTeamForm({
  sessionId,
  currentTeamId,
  teams,
}: {
  sessionId: number;
  currentTeamId: number;
  teams: Team[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
        Match Team
      </label>
      <select
        defaultValue={currentTeamId}
        disabled={isPending}
        onChange={event => {
          const nextTeamId = Number(event.target.value);
          startTransition(async () => {
            try {
              await changeSessionTeam(sessionId, nextTeamId);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to change match team');
            }
          });
        }}
        className="bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-sm text-yellow-300 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
      >
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
