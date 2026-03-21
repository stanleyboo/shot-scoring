'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  isAdmin: boolean;
}

const links = [
  { href: '/sessions', label: 'Matches' },
  { href: '/players', label: 'Players' },
  { href: '/teams', label: 'Teams' },
  { href: '/stats', label: 'Stats' },
  { href: '/feedback', label: 'Feedback' },
];

export default function NavLinks({ isAdmin }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex gap-3 sm:gap-5 text-xs sm:text-sm overflow-x-auto">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 font-[family-name:var(--font-display)] text-sm sm:text-base ${
            isActive(link.href)
              ? 'text-[var(--gold)] border-[var(--gold)]'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--gold)]'
          }`}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin ? (
        <Link
          href="/admin"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 font-[family-name:var(--font-display)] text-sm sm:text-base ${
            isActive('/admin')
              ? 'text-[var(--gold)] border-[var(--gold)]'
              : 'text-[var(--gold)]/70 border-transparent hover:text-[var(--gold-hover)]'
          }`}
        >
          Admin
        </Link>
      ) : (
        <Link
          href="/login"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 font-[family-name:var(--font-display)] text-sm sm:text-base ${
            isActive('/login')
              ? 'text-[var(--text-muted)] border-[var(--gold)]'
              : 'text-[var(--text-dim)] border-transparent hover:text-[var(--text-muted)]'
          }`}
        >
          Login
        </Link>
      )}
    </div>
  );
}
