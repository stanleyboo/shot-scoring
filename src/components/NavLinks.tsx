'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PageVisibility } from '@/lib/auth';

interface Props {
  isAdmin: boolean;
  pageVisibility: Record<string, PageVisibility>;
}

const allLinks = [
  { href: '/sessions', label: 'Matches', key: 'page_matches' },
  { href: '/players', label: 'Players', key: 'page_players' },
  { href: '/teams', label: 'Teams', key: 'page_teams' },
  { href: '/stats', label: 'Stats', key: 'page_stats' },
  { href: '/feedback', label: 'Feedback', key: 'page_feedback' },
  { href: '/social', label: 'Social', key: 'page_social' },
  { href: '/updates', label: 'Calendar', key: 'page_updates' },
];

export default function NavLinks({ isAdmin, pageVisibility }: Props) {
  const pathname = usePathname();

  const links = allLinks.filter(link => {
    const vis = pageVisibility[link.key] ?? 'all';
    if (vis === 'off') return false;
    if (vis === 'admin') return isAdmin;
    return true;
  });

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
