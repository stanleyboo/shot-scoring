'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  isAdmin: boolean;
}

const links = [
  { href: '/sessions', label: 'Matches' },
  { href: '/players', label: 'Players' },
  { href: '/stats', label: 'Stats' },
];

export default function NavLinks({ isAdmin }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex gap-5 text-sm">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive(link.href)
              ? 'text-yellow-300 border-yellow-400'
              : 'text-stone-300 border-transparent hover:text-yellow-300'
          }`}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin ? (
        <Link
          href="/admin"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive('/admin')
              ? 'text-yellow-300 border-yellow-400'
              : 'text-yellow-300/70 border-transparent hover:text-yellow-200'
          }`}
        >
          Admin
        </Link>
      ) : (
        <Link
          href="/login"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive('/login')
              ? 'text-stone-300 border-yellow-400'
              : 'text-stone-500 border-transparent hover:text-stone-300'
          }`}
        >
          Login
        </Link>
      )}
    </div>
  );
}
