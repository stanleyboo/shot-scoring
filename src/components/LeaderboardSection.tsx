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
    <div className="overflow-hidden border border-stone-800 bg-[#111] rounded-lg">
      <div className="border-b border-stone-800 bg-yellow-400 px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-black">{board.title}</h3>
        <p className="text-[11px] text-black">{board.subtitle}</p>
      </div>
      <ul className="divide-y divide-stone-800">
        {entries.map((entry, index) => (
          <li key={`${entry.player_id}-${entry.label ?? index}`} className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`w-5 text-right text-sm font-bold tabular-nums ${
                index === 0 ? 'text-yellow-300' : index === 1 ? 'text-stone-300' : index === 2 ? 'text-amber-500' : 'text-stone-600'
              }`}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/players/${entry.player_id}`}
                  className="block truncate text-sm text-white transition-colors hover:text-yellow-300"
                >
                  {entry.name}
                </Link>
                {entry.label && <p className="truncate text-[11px] text-stone-500">{entry.label}</p>}
              </div>
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
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
          <h1 className="text-3xl font-black text-yellow-300">Leaderboards</h1>
          <p className="text-sm text-stone-400">Overall club records and team-by-team breakdowns.</p>
        </div>
        <button
          onClick={() => setUniqueOnly(!uniqueOnly)}
          className={`border px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition ${
            uniqueOnly
              ? 'border-yellow-400 bg-yellow-400 text-black'
              : 'border-stone-700 bg-black text-stone-200 hover:border-yellow-400'
          }`}
        >
          {uniqueOnly ? 'Best per player' : 'All entries'}
        </button>
      </div>

      {visibleSections.map(section => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-bold text-white">{section.title}</h2>

          {section.match.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Single Match</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.match.map(board => (
                  <LeaderboardCard key={`${section.title}-${board.title}-match`} board={board} uniqueOnly={uniqueOnly} />
                ))}
              </div>
            </div>
          )}

          {section.career.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Career Totals</p>
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
