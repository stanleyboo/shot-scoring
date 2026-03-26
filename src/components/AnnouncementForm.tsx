'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAnnouncement } from '@/actions/announcements';

export default function AnnouncementForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('update');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await addAnnouncement(title, content, type, eventDate || null);
      if (result.ok) {
        setTitle('');
        setContent('');
        setType('update');
        setEventDate('');
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to create');
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-[var(--gold)]/40 bg-white/25 backdrop-blur-sm rounded p-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wide hover:border-[var(--gold)] transition"
      >
        + New Announcement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[var(--gold)] bg-white/25 backdrop-blur-sm rounded p-4 space-y-3">
      <div className="flex gap-3">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)] cursor-pointer"
        >
          <option value="update">Update</option>
          <option value="match">Match Fixture</option>
          <option value="training">Training</option>
        </select>
        <input
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
          placeholder="Date (optional)"
        />
      </div>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={100}
        className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Details..."
        maxLength={1000}
        rows={3}
        className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)] resize-none"
      />
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[var(--gold)] text-[var(--bg)] font-bold text-sm uppercase tracking-wide rounded px-4 py-2 hover:bg-[var(--gold-hover)] transition disabled:opacity-50"
        >
          Post
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-[var(--border)] text-[var(--text-muted)] text-sm rounded px-4 py-2 hover:border-[var(--gold)] transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
