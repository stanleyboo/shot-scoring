import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb, getActiveSession } from '@/lib/db';

export default function HomePage() {
  const active = getActiveSession(getDb());
  if (active) redirect(`/sessions/${active.id}`);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
      <h1 className="text-4xl font-black text-slate-100">ShotScore</h1>
      <p className="text-slate-400 max-w-xs leading-relaxed">
        Track netball shooting percentages live during training.
      </p>
      <Link
        href="/sessions/new"
        className="rounded-2xl bg-indigo-600 px-10 py-4 text-xl font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all"
      >
        Start Session
      </Link>
      <div className="flex gap-6 text-sm mt-2">
        <Link href="/sessions" className="text-slate-500 hover:text-slate-300 transition-colors">
          View History
        </Link>
        <Link href="/players" className="text-slate-500 hover:text-slate-300 transition-colors">
          Manage Players
        </Link>
      </div>
    </div>
  );
}
