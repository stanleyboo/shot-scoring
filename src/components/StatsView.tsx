'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Leaderboard } from '@/lib/db';

type ViewMode = 'match' | 'career' | 'quarter';

interface TeamData {
  id: number;
  name: string;
  match: Leaderboard[];
  career: Leaderboard[];
  quarterBoards: Leaderboard[];
}

interface Props {
  clubMatch: Leaderboard[];
  clubCareer: Leaderboard[];
  clubQuarter: Leaderboard[];
  teams: TeamData[];
  // For team page: single-team mode (no team dropdown)
  singleTeam?: boolean;
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

export default function StatsView({
  clubMatch, clubCareer, clubQuarter, teams,
  singleTeam = false,
  heading = 'Leaderboards',
  subtitle = 'Overall club records and team-by-team breakdowns.',
}: Props) {
  const [view, setView] = useState<ViewMode>('match');
  const [uniqueOnly, setUniqueOnly] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>('all');

  // Get the active boards based on team selection
  let matchBoards: Leaderboard[];
  let careerBoards: Leaderboard[];
  let quarterBoards: Leaderboard[];

  if (selectedTeam === 'all') {
    matchBoards = clubMatch;
    careerBoards = clubCareer;
    quarterBoards = clubQuarter;
  } else {
    const team = teams.find(t => t.id === selectedTeam);
    matchBoards = team?.match ?? [];
    careerBoards = team?.career ?? [];
    quarterBoards = team?.quarterBoards ?? [];
  }

  const hasMatch = matchBoards.length > 0;
  const hasCareer = careerBoards.length > 0;
  const hasQuarter = quarterBoards.length > 0;

  if (!hasMatch && !hasCareer && !hasQuarter) return null;

  const availableViews = (['match', 'career', 'quarter'] as ViewMode[]).filter(v => {
    if (v === 'match') return hasMatch;
    if (v === 'career') return hasCareer;
    if (v === 'quarter') return hasQuarter;
    return false;
  });

  // Reset view if current is no longer available
  const activeView = availableViews.includes(view) ? view : availableViews[0];

  const boards = activeView === 'quarter' ? quarterBoards : activeView === 'career' ? careerBoards : matchBoards;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">{heading}</h1>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!singleTeam && teams.length > 0 && (
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[var(--gold)] cursor-pointer"
            >
              <option value="all">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <select
            value={activeView}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {boards.map(board => (
          <LeaderboardCard key={board.title} board={board} uniqueOnly={uniqueOnly} />
        ))}
      </div>
    </div>
  );
}
