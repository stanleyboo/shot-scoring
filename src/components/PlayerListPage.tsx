'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';
import PlayerList from './PlayerList';
import type { Player, Team } from '@/lib/db';

type PlayerWithShots = Player & { total_shots: number };

interface Props {
  players: PlayerWithShots[];
  teams: Team[];
  canEdit: boolean;
}

export default function PlayerListPage({ players, teams, canEdit }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players;

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search players..."
      />
      <div className="space-y-6">
        {teams.map(team => {
          const teamPlayers = filtered.filter(p => p.team_id === team.id);
          if (teamPlayers.length === 0 && search) return null;
          return (
            <section key={team.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-display)] uppercase">{team.name}</h2>
                <p className="text-sm text-[var(--text-dim)]">{teamPlayers.length} players</p>
              </div>
              <PlayerList players={teamPlayers} teams={teams} canEdit={canEdit} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
