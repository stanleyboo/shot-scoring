'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Leaderboard } from '@/lib/db';

interface Props {
  quarters: { quarter: number; boards: Leaderboard[] }[];
}

export default function QuarterLeaderboards({ quarters }: Props) {
  const [activeQ, setActiveQ] = useState(quarters[0]?.quarter ?? 1);
  const active = quarters.find(q => q.quarter === activeQ);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Per Quarter Stats</h2>
          <p className="text-sm text-[var(--text-muted)]">Career totals broken down by quarter.</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(q => {
            const hasData = quarters.some(qb => qb.quarter === q);
            return (
              <button
                key={q}
                onClick={() => setActiveQ(q)}
                disabled={!hasData}
                className={`px-3 py-1.5 text-sm font-bold rounded transition-all font-[family-name:var(--font-display)] ${
                  activeQ === q
                    ? 'bg-[var(--gold)] text-[var(--bg)]'
                    : hasData
                      ? 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)]'
                      : 'border border-[var(--border)] text-[var(--text-dim)] opacity-40 cursor-not-allowed'
                }`}
              >
                Q{q}
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.boards.map(board => (
            <div key={board.title} className="overflow-hidden border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded">
              <div className="border-b border-[var(--border)] bg-[var(--gold)] px-4 py-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-[var(--bg)] font-[family-name:var(--font-display)]">{board.title}</h3>
                <p className="text-[11px] text-[var(--bg)]/70">{board.subtitle}</p>
              </div>
              <ul className="divide-y divide-[var(--border)]">
                {board.entries.map((entry, index) => (
                  <li key={entry.player_id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`w-5 text-right text-sm font-bold tabular-nums ${
                        index === 0 ? 'text-[var(--gold)]' : index === 1 ? 'text-[var(--text-muted)]' : index === 2 ? 'text-[var(--gold-secondary)]' : 'text-[var(--text-dim)]'
                      }`}>
                        {index + 1}
                      </span>
                      <Link
                        href={`/players/${entry.player_id}`}
                        className="truncate text-sm text-[var(--text)] transition-colors hover:text-[var(--gold)]"
                      >
                        {entry.name}
                      </Link>
                    </div>
                    <span className="text-sm font-bold text-[var(--text)] tabular-nums">
                      {board.format === 'percent' ? `${entry.value}%` : entry.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
