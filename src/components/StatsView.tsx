'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Leaderboard } from '@/lib/db';

type ViewMode = 'match' | 'career' | 'quarter';

interface Section {
  title: string;
  match: Leaderboard[];
  career: Leaderboard[];
}

interface Props {
  sections: Section[];
  quarterBoards: Leaderboard[];
  heading?: string;
  subtitle?: string;
}

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

  if (entries.length === 0) return null;

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

const VIEW_LABELS: Record<ViewMode, string> = {
  match: 'Single Match',
  career: 'Career',
  quarter: 'Quarter',
};

export default function StatsView({ sections, quarterBoards, heading = 'Leaderboards', subtitle = 'Overall club records and team-by-team breakdowns.' }: Props) {
  const [view, setView] = useState<ViewMode>('match');
  const [uniqueOnly, setUniqueOnly] = useState(true);

  const hasMatch = sections.some(s => s.match.length > 0);
  const hasCareer = sections.some(s => s.career.length > 0);
  const hasQuarter = quarterBoards.length > 0;

  if (!hasMatch && !hasCareer && !hasQuarter) return null;

  const availableViews = (['match', 'career', 'quarter'] as ViewMode[]).filter(v => {
    if (v === 'match') return hasMatch;
    if (v === 'career') return hasCareer;
    if (v === 'quarter') return hasQuarter;
    return false;
  });

  const boards: Leaderboard[] = [];
  if (view === 'quarter') {
    boards.push(...quarterBoards);
  } else {
    for (const section of sections) {
      const sectionBoards = view === 'match' ? section.match : section.career;
      boards.push(...sectionBoards);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">{heading}</h1>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={e => setView(e.target.value as ViewMode)}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[var(--gold)] cursor-pointer"
          >
            {availableViews.map(v => (
              <option key={v} value={v}>{VIEW_LABELS[v]}</option>
            ))}
          </select>
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
      </div>

      {/* Section titles only for match/career when multiple sections */}
      {view !== 'quarter' && sections.length > 1 ? (
        sections.map(section => {
          const sectionBoards = view === 'match' ? section.match : section.career;
          if (sectionBoards.length === 0) return null;
          return (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">{section.title}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sectionBoards.map(board => (
                  <LeaderboardCard key={`${section.title}-${board.title}`} board={board} uniqueOnly={uniqueOnly} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {boards.map(board => (
            <LeaderboardCard key={board.title} board={board} uniqueOnly={uniqueOnly} />
          ))}
        </div>
      )}
    </div>
  );
}
