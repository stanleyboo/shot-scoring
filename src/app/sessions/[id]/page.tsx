import { notFound, redirect } from 'next/navigation';
import { getDb, getSessionWithStats, getAllStatTypes } from '@/lib/db';
import { canEdit } from '@/lib/auth';
import ScoringBoard from '@/components/ScoringBoard';

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

  const editor = await canEdit();
  if (!editor) {
    redirect(`/sessions/${sessionId}/summary`);
  }

  const statTypes = getAllStatTypes(db, true);

  return (
    <ScoringBoard
      session={data.session}
      players={data.players}
      statTypes={statTypes}
    />
  );
}
