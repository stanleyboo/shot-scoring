import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import NavLinks from './NavLinks';

export default async function Nav() {
  const admin = await isAdmin();

  return (
    <nav className="border-b-2 border-yellow-400 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="bg-yellow-400 px-3 py-2 text-xl font-black uppercase tracking-[0.18em] text-black transition hover:bg-yellow-300">
          Langwith Netball
        </Link>
        <NavLinks isAdmin={admin} />
      </div>
    </nav>
  );
}
