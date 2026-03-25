import { notFound, redirect } from 'next/navigation';
import { getDb, getSessionWithStats, getAllStatTypes, getAllPlayers } from '@/lib/db';
import ScoringBoard from '@/components/ScoringBoard';
import AddPlayerToSession from '@/components/AddPlayerToSession';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) notFound();

  const db = getDb();
  const data = getSessionWithStats(db, sessionId);
  if (!data) notFound();

  if (data.session.ended_at) {
    redirect(`/sessions/${sessionId}/summary`);
  }

  const statTypes = getAllStatTypes(db, true);
  const allPlayers = getAllPlayers(db);
  const playerIdsInSession = new Set(data.players.map(p => p.player_id));
  const availablePlayers = allPlayers.filter(p => !playerIdsInSession.has(p.id));

  return (
    <div className="space-y-4">
      <ScoringBoard
        session={data.session}
        players={data.players}
        statTypes={statTypes}
      />
      <AddPlayerToSession sessionId={sessionId} availablePlayers={availablePlayers} />
    </div>
  );
}
