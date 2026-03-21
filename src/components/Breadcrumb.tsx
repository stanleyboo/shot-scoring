import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[var(--text-dim)]">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-[var(--text-dim)] hover:text-[var(--gold)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--gold)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
