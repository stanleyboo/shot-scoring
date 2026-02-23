import { notFound, redirect } from 'next/navigation';
import { getDb, getSessionWithStats } from '@/lib/db';
import ScoringBoard from '@/components/ScoringBoard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) notFound();

  const data = getSessionWithStats(getDb(), sessionId);
  if (!data) notFound();

  if (data.session.ended_at) {
    redirect(`/sessions/${sessionId}/summary`);
  }

  return <ScoringBoard session={data.session} players={data.players} />;
}
