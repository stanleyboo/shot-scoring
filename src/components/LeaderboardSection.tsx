'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Leaderboard } from '@/lib/db';

function LeaderboardCard({ board, uniqueOnly }: { board: Leaderboard; uniqueOnly: boolean }) {
  let entries = board.entries;
  if (uniqueOnly) {
    const seen = new Set<number>();
    entries = entries.filter(entry => {
      if (seen.has(entry.player_id)) return false;
      seen.add(entry.player_id);
      return true;
    });
  }

  return (
    <div className="overflow-hidden border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded">
      <div className="border-b border-[var(--border)] bg-[var(--gold)] px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-[var(--bg)] font-[family-name:var(--font-display)]">{board.title}</h3>
        <p className="text-[11px] text-[var(--bg)]/70">{board.subtitle}</p>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {entries.map((entry, index) => (
          <li key={`${entry.player_id}-${entry.label ?? index}`} className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`w-5 text-right text-sm font-bold tabular-nums ${
                index === 0 ? 'text-[var(--gold)]' : index === 1 ? 'text-[var(--text-muted)]' : index === 2 ? 'text-[var(--gold-secondary)]' : 'text-[var(--text-dim)]'
              }`}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/players/${entry.player_id}`}
                  className="block truncate text-sm text-[var(--text)] transition-colors hover:text-[var(--gold)]"
                >
                  {entry.name}
                </Link>
                {entry.label && <p className="truncate text-[11px] text-[var(--text-dim)]">{entry.label}</p>}
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--text)] tabular-nums">
              {board.format === 'percent' ? `${entry.value}%` : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Section {
  title: string;
  match: Leaderboard[];
  career: Leaderboard[];
}

export default function LeaderboardSection({ sections }: { sections: Section[] }) {
  const [uniqueOnly, setUniqueOnly] = useState(true);
  const visibleSections = sections.filter(section => section.match.length > 0 || section.career.length > 0);

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Leaderboards</h1>
          <p className="text-sm text-[var(--text-muted)]">Overall club records and team-by-team breakdowns.</p>
        </div>
        <button
          onClick={() => setUniqueOnly(!uniqueOnly)}
          className={`border px-4 py-2 rounded text-xs font-black uppercase tracking-wide transition ${
            uniqueOnly
              ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--bg)]'
              : 'border-[var(--border)] bg-white/25 backdrop-blur-sm text-[var(--text-muted)] hover:border-[var(--gold)]'
          }`}
        >
          {uniqueOnly ? 'Best per player' : 'All entries'}
        </button>
      </div>

      {visibleSections.map(section => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">{section.title}</h2>

          {section.match.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">Single Match</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.match.map(board => (
                  <LeaderboardCard key={`${section.title}-${board.title}-match`} board={board} uniqueOnly={uniqueOnly} />
                ))}
              </div>
            </div>
          )}

          {section.career.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">Career Totals</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.career.map(board => (
                  <LeaderboardCard key={`${section.title}-${board.title}-career`} board={board} uniqueOnly={uniqueOnly} />
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
