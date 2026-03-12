import { getDb, getAllPlayers, getAllTeams } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import AddPlayerForm from '@/components/AddPlayerForm';
import PlayerListPage from '@/components/PlayerListPage';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const db = getDb();
  const admin = await isAdmin();
  const teams = getAllTeams(db);
  const players = db
    .prepare(
      `SELECT
         p.*,
         t.name AS team_name,
         COALESCE(COUNT(s.id), 0) AS total_shots
       FROM players p
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN shots s ON s.player_id = p.id
       GROUP BY p.id
       ORDER BY t.name ASC, p.name ASC`
    )
    .all() as (ReturnType<typeof getAllPlayers>[number] & { total_shots: number })[];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-yellow-300">Players</h1>
        <p className="text-sm text-stone-400">
          Club squad list with team-by-team breakdowns. Add extra teams in Admin, then move players here.
        </p>
      </div>

      {admin && teams.length > 0 && <AddPlayerForm teams={teams} />}

      <PlayerListPage players={players} teams={teams} canEdit={admin} />
    </div>
  );
}
