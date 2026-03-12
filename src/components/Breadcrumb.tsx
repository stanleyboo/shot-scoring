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
          {i > 0 && <span className="text-stone-600">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-stone-500 hover:text-yellow-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-yellow-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
