'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeAnnouncement } from '@/actions/announcements';
import type { Announcement } from '@/lib/db';

interface Props {
  announcements: Announcement[];
  isAdmin: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; border: string }> = {
  match: { label: 'Upcoming Matches', icon: '🏐', color: 'bg-[var(--green)]', border: 'border-l-[var(--green)]' },
  training: { label: 'Training Sessions', icon: '💪', color: 'bg-blue-500', border: 'border-l-blue-500' },
  social: { label: 'Socials', icon: '🎉', color: 'bg-purple-500', border: 'border-l-purple-500' },
  update: { label: 'Announcements', icon: '📢', color: 'bg-[var(--gold)]', border: 'border-l-[var(--gold)]' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);

  const formatted = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (diff === 0) return `Today — ${formatted}`;
  if (diff === 1) return `Tomorrow — ${formatted}`;
  if (diff > 1 && diff <= 7) return `In ${diff} days — ${formatted}`;
  return formatted;
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m}${suffix}`;
}

function AnnouncementCard({ a, isAdmin, onDelete, isPending }: {
  a: Announcement;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  isPending: boolean;
}) {
  const config = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.update;
  const isPast = a.event_date && new Date(a.event_date + 'T23:59:59') < new Date();

  return (
    <div className={`border border-[var(--border)] border-l-4 ${config.border} bg-white/25 backdrop-blur-sm rounded overflow-hidden ${isPast ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">{a.title}</h3>

          {/* Event details row */}
          {(a.event_date || a.event_time || a.location || a.opponent) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--text-muted)]">
              {a.event_date && (
                <span className="flex items-center gap-1">
                  <span className="text-[var(--text-dim)]">📅</span>
                  {formatDate(a.event_date)}
                </span>
              )}
              {a.event_time && (
                <span className="flex items-center gap-1">
                  <span className="text-[var(--text-dim)]">🕐</span>
                  {formatTime(a.event_time)}
                </span>
              )}
              {a.location && (
                <span className="flex items-center gap-1">
                  <span className="text-[var(--text-dim)]">📍</span>
                  {a.location}
                </span>
              )}
              {a.opponent && (
                <span className="flex items-center gap-1">
                  <span className="text-[var(--text-dim)]">vs</span>
                  <span className="font-bold">{a.opponent}</span>
                </span>
              )}
            </div>
          )}

          {a.content && (
            <p className="text-sm text-[var(--text-muted)] mt-2 whitespace-pre-line">{a.content}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => onDelete(a.id)}
            disabled={isPending}
            className="text-[var(--text-dim)] hover:text-[var(--red)] transition text-xs flex-shrink-0"
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementList({ announcements, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm('Delete this announcement?')) return;
    startTransition(async () => {
      await removeAnnouncement(id);
      router.refresh();
    });
  }

  if (announcements.length === 0) {
    return (
      <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-8 text-center text-[var(--text-dim)]">
        No announcements yet.
      </div>
    );
  }

  // Group by type, ordering: matches first, then training, then updates
  const typeOrder: string[] = ['match', 'training', 'social', 'update'];
  const grouped = typeOrder
    .map(type => ({
      type,
      config: TYPE_CONFIG[type],
      items: announcements.filter(a => a.type === type),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(group => (
        <section key={group.type} className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase flex items-center gap-2">
            <span>{group.config.icon}</span>
            {group.config.label}
            <span className="text-xs font-normal text-[var(--text-dim)] lowercase">({group.items.length})</span>
          </h2>
          <div className="space-y-2">
            {group.items.map(a => (
              <AnnouncementCard key={a.id} a={a} isAdmin={isAdmin} onDelete={handleDelete} isPending={isPending} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
