import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="border-b border-slate-700 bg-slate-900 px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <Link href="/" className="text-lg font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          ShotScore
        </Link>
        <div className="flex gap-5 text-sm">
          <Link href="/sessions" className="text-slate-300 hover:text-white transition-colors">
            History
          </Link>
          <Link href="/players" className="text-slate-300 hover:text-white transition-colors">
            Players
          </Link>
        </div>
      </div>
    </nav>
  );
}
