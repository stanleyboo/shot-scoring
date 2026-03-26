'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeAnnouncement } from '@/actions/announcements';
import type { Announcement } from '@/lib/db';

interface Props {
  announcements: Announcement[];
  isAdmin: boolean;
}

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  update: { label: 'Update', color: 'bg-[var(--gold)] text-[var(--bg)]' },
  match: { label: 'Match', color: 'bg-[var(--green)] text-[var(--bg)]' },
  training: { label: 'Training', color: 'bg-blue-500 text-white' },
};

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

  return (
    <div className="space-y-3">
      {announcements.map(a => {
        const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.update;
        return (
          <div key={a.id} className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded overflow-hidden">
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${style.color}`}>
                    {style.label}
                  </span>
                  {a.event_date && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(a.event_date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-dim)]">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h3 className="font-bold text-[var(--text)] mt-1 font-[family-name:var(--font-display)] uppercase">{a.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 whitespace-pre-line">{a.content}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={isPending}
                  className="text-[var(--text-dim)] hover:text-[var(--red)] transition text-xs flex-shrink-0"
                  title="Delete announcement"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
