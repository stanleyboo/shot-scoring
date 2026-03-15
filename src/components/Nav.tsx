import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getDb, getSetting } from '@/lib/db';
import NavLinks from './NavLinks';

export default async function Nav() {
  const admin = await isAdmin();
  const clubName = getSetting(getDb(), 'club_name') ?? 'Langwith Netball';

  return (
    <nav className="border-b-2 border-yellow-400 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="bg-yellow-400 px-1.5 py-1 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-yellow-300 sm:px-2.5 sm:py-1.5 sm:text-xs">
          {clubName}
        </Link>
        <NavLinks isAdmin={admin} />
      </div>
    </nav>
  );
}
