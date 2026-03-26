'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeAnnouncement, editAnnouncement } from '@/actions/announcements';
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

function EditForm({ a, onCancel, onSaved }: {
  a: Announcement;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(a.title);
  const [content, setContent] = useState(a.content);
  const [type, setType] = useState(a.type);
  const [eventDate, setEventDate] = useState(a.event_date ?? '');
  const [eventTime, setEventTime] = useState(a.event_time ?? '');
  const [location, setLocation] = useState(a.location ?? '');
  const [opponent, setOpponent] = useState(a.opponent ?? '');
  const [error, setError] = useState('');

  const isEvent = type === 'match' || type === 'training' || type === 'social';
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.update;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await editAnnouncement(a.id, {
        title, content, type,
        event_date: eventDate || null,
        event_time: eventTime || null,
        location: location || null,
        opponent: opponent || null,
      });
      if (result.ok) {
        onSaved();
      } else {
        setError(result.error ?? 'Failed to save');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`border border-[var(--border)] border-l-4 ${config.border} bg-white/25 backdrop-blur-sm rounded p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <select
          value={type}
          onChange={e => setType(e.target.value as Announcement['type'])}
          className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-2 py-1 text-xs font-bold uppercase focus:outline-none focus:border-[var(--gold)] cursor-pointer"
        >
          <option value="match">Match</option>
          <option value="training">Training</option>
          <option value="social">Social</option>
          <option value="update">Announcement</option>
        </select>
        <button type="button" onClick={onCancel} className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition">
          Cancel
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={100}
        className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
      />

      {type === 'match' && (
        <input
          type="text"
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          placeholder="Opponent"
          maxLength={100}
          className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
        />
      )}

      {isEvent && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]" />
          <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]" />
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" maxLength={100}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)] col-span-2 sm:col-span-1" />
        </div>
      )}

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Details..."
        maxLength={1000}
        rows={3}
        className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)] resize-none"
      />

      {error && <p className="text-xs text-[var(--red)]">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--gold)] text-[var(--bg)] font-bold text-sm uppercase tracking-wide rounded px-4 py-2 hover:bg-[var(--gold-hover)] transition disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}

function AnnouncementCard({ a, isAdmin, onDelete, onEdit, isPending }: {
  a: Announcement;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  isPending: boolean;
}) {
  const config = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.update;
  const isPast = a.event_date && new Date(a.event_date + 'T23:59:59') < new Date();

  return (
    <div className={`border border-[var(--border)] border-l-4 ${config.border} bg-white/25 backdrop-blur-sm rounded overflow-hidden ${isPast ? 'opacity-50' : ''}`}>
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase">{a.title}</h3>

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
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(a.id)}
              disabled={isPending}
              className="text-[var(--text-dim)] hover:text-[var(--gold)] transition text-xs"
              title="Edit"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(a.id)}
              disabled={isPending}
              className="text-[var(--text-dim)] hover:text-[var(--red)] transition text-xs"
              title="Delete"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementList({ announcements, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);

  function handleDelete(id: number) {
    if (!confirm('Delete this announcement?')) return;
    startTransition(async () => {
      await removeAnnouncement(id);
      router.refresh();
    });
  }

  function handleSaved() {
    setEditingId(null);
    router.refresh();
  }

  if (announcements.length === 0) {
    return (
      <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-8 text-center text-[var(--text-dim)]">
        No announcements yet.
      </div>
    );
  }

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
            {group.items.map(a =>
              editingId === a.id ? (
                <EditForm key={a.id} a={a} onCancel={() => setEditingId(null)} onSaved={handleSaved} />
              ) : (
                <AnnouncementCard key={a.id} a={a} isAdmin={isAdmin} onDelete={handleDelete} onEdit={setEditingId} isPending={isPending} />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
