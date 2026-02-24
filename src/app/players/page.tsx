import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
import AddPlayerForm from '@/components/AddPlayerForm';
import PlayerList from '@/components/PlayerList';

export default function PlayersPage() {
  const players = getDb()
    .prepare(
      `SELECT p.*, COALESCE(COUNT(s.id), 0) AS total_shots
       FROM players p
       LEFT JOIN shots s ON s.player_id = p.id
       GROUP BY p.id
       ORDER BY p.name ASC`
    )
    .all() as (Parameters<typeof PlayerList>[0]['players'][number])[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Players</h1>
      <AddPlayerForm />
      <PlayerList players={players} />
    </div>
  );
}
