import Link from 'next/link';
import { getDb, getAllPlayers } from '@/lib/db';
import NewSessionForm from '@/components/NewSessionForm';

export default function NewSessionPage() {
  const players = getAllPlayers(getDb());
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">New Session</h1>
      </div>
      <NewSessionForm players={players} />
    </div>
  );
}
