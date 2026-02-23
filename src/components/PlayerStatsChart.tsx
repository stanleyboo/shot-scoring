'use client';

import type { PlayerCareerStats } from '@/lib/db';

type SessionStat = PlayerCareerStats['sessions'][number];

export default function PlayerStatsChart({ sessions }: { sessions: SessionStat[] }) {
  const recent = [...sessions].reverse().slice(-10); // last 10, oldest first

  if (recent.length === 0) {
    return <p className="text-center text-slate-500 py-4">No session data yet.</p>;
  }

  const maxAttempted = Math.max(...recent.map(s => s.attempted), 1);

  return (
    <div className="space-y-2">
      {recent.map(s => {
        const p = s.attempted === 0 ? 0 : s.made / s.attempted;
        const pct = Math.round(p * 100);
        const barW = s.attempted === 0 ? 0 : (s.attempted / maxAttempted) * 100;
        const barColor = pct >= 70 ? 'bg-green-600' : pct >= 50 ? 'bg-yellow-600' : 'bg-red-600';
        return (
          <div key={s.session_id} className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-right text-xs text-slate-500">
              {new Date(s.started_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <div className="relative flex-1 h-8 overflow-hidden rounded-lg bg-slate-800">
              <div
                className={`h-full transition-all ${barColor}`}
                style={{ width: `${barW}%` }}
              />
              <span className="absolute inset-0 flex items-center px-2.5 text-xs font-semibold text-white">
                {s.attempted === 0 ? '—' : `${pct}% (${s.made}/${s.attempted})`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
