import { getDb, getAllPlayersWithShots, getAllTeams } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import AddPlayerForm from '@/components/AddPlayerForm';
import PlayerListPage from '@/components/PlayerListPage';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const db = getDb();
  const admin = await isAdmin();
  const teams = getAllTeams(db);
  const players = getAllPlayersWithShots(db);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Players</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Club squad list with team-by-team breakdowns. Add extra teams in Admin, then move players here.
        </p>
      </div>

      {admin && teams.length > 0 && <AddPlayerForm teams={teams} />}

      <PlayerListPage players={players} teams={teams} canEdit={admin} />
    </div>
  );
}
