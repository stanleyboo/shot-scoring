'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Leaderboard } from '@/lib/db';

interface Props {
  leaderboards: { match: Leaderboard[]; career: Leaderboard[] };
}

export default function TeamLeaderboards({ leaderboards }: Props) {
  const [uniqueOnly, setUniqueOnly] = useState(true);

  const filterEntries = (board: Leaderboard) => {
    if (!uniqueOnly) return board.entries;
    const seen = new Set<number>();
    return board.entries.filter(entry => {
      if (seen.has(entry.player_id)) return false;
      seen.add(entry.player_id);
      return true;
    });
  };

  if (leaderboards.match.length === 0 && leaderboards.career.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Team Leaderboards</h2>
        <div className="border-2 border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm p-8 text-center text-[var(--text-dim)]">
          Team leaderboards will populate once match data is recorded.
        </div>
      </section>
    );
  }

  const allBoards = [...leaderboards.match, ...leaderboards.career];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Team Leaderboards</h2>
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
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {allBoards.map(board => {
          const entries = filterEntries(board);
          return (
            <div key={`${board.title}-${board.subtitle}`} className="overflow-hidden border-2 border-[var(--border)] bg-white/25 backdrop-blur-sm rounded">
              <div className="border-b-2 border-[var(--border)] bg-[var(--gold)] px-4 py-3">
                <p className="text-sm font-black uppercase tracking-wide text-[var(--bg)] font-[family-name:var(--font-display)]">{board.title}</p>
                <p className="text-xs text-[var(--bg)]/70">{board.subtitle}</p>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {entries.slice(0, 5).map((entry, index) => (
                  <li key={`${entry.player_id}-${entry.label ?? index}`} className="flex items-center justify-between px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`w-5 text-right text-sm font-bold tabular-nums ${
                        index === 0 ? 'text-[var(--gold)]' : index === 1 ? 'text-[var(--text-muted)]' : index === 2 ? 'text-[var(--gold-secondary)]' : 'text-[var(--text-dim)]'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/players/${entry.player_id}`} className="block truncate text-sm font-medium text-[var(--text)] transition hover:text-[var(--gold)]">
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
        })}
      </div>
    </section>
  );
}
