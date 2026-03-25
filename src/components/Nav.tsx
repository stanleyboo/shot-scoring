import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getDb, getSetting } from '@/lib/db';
import NavLinks from './NavLinks';

export default async function Nav() {
  const admin = await isAdmin();
  const clubName = getSetting(getDb(), 'club_name') ?? 'Langwith Netball';

  return (
    <nav className="relative z-10 border-b-2 border-[var(--surface)]/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="bg-[var(--gold)] px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bg)] transition hover:opacity-80 sm:px-2.5 sm:py-1.5 sm:text-xs font-[family-name:var(--font-display)]">
          {clubName}
        </Link>
        <NavLinks isAdmin={admin} />
      </div>
    </nav>
  );
}
