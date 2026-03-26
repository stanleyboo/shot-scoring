import Link from 'next/link';
import type { Announcement } from '@/lib/db';

const TYPE_CONFIG: Record<string, { icon: string; border: string }> = {
  match: { icon: '🏐', border: 'border-l-[var(--green)]' },
  training: { icon: '💪', border: 'border-l-blue-500' },
  social: { icon: '🎉', border: 'border-l-purple-500' },
  update: { icon: '📢', border: 'border-l-[var(--gold)]' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);

  const formatted = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatted;
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m}${suffix}`;
}

export default function UpcomingEvents({ events }: { events: Announcement[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">Upcoming</h2>
        <Link href="/updates" className="text-sm text-[var(--gold)] hover:text-[var(--gold-hover)]">
          Full calendar →
        </Link>
      </div>
      <div className="space-y-2">
        {events.map(e => {
          const config = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.update;
          return (
            <div key={e.id} className={`border border-[var(--border)] border-l-4 ${config.border} bg-white/25 backdrop-blur-sm rounded px-4 py-3`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{config.icon}</span>
                <h3 className="font-bold text-sm text-[var(--text)] font-[family-name:var(--font-display)] uppercase truncate">{e.title}</h3>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-muted)]">
                {e.event_date && <span>{formatDate(e.event_date)}</span>}
                {e.event_time && <span>{formatTime(e.event_time)}</span>}
                {e.location && <span>📍 {e.location}</span>}
                {e.opponent && <span>vs {e.opponent}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
