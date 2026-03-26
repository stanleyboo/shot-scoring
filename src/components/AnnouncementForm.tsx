'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAnnouncement } from '@/actions/announcements';

type AnnouncementType = 'match' | 'training' | 'social' | 'update';

const TEMPLATES: { type: AnnouncementType; label: string; icon: string; color: string; defaults: { title: string; content: string } }[] = [
  {
    type: 'match',
    label: 'Match',
    icon: '🏐',
    color: 'border-[var(--green)] bg-[var(--green)]/10 hover:bg-[var(--green)]/20',
    defaults: { title: '', content: '' },
  },
  {
    type: 'training',
    label: 'Training',
    icon: '💪',
    color: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
    defaults: { title: 'Training Session', content: '' },
  },
  {
    type: 'social',
    label: 'Social',
    icon: '🎉',
    color: 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/20',
    defaults: { title: '', content: '' },
  },
  {
    type: 'update',
    label: 'Announcement',
    icon: '📢',
    color: 'border-[var(--gold)] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20',
    defaults: { title: '', content: '' },
  },
];

export default function AnnouncementForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<AnnouncementType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [error, setError] = useState('');

  function selectTemplate(type: AnnouncementType) {
    const tpl = TEMPLATES.find(t => t.type === type)!;
    setSelectedType(type);
    setTitle(tpl.defaults.title);
    setContent(tpl.defaults.content);
    setEventDate('');
    setEventTime('');
    setLocation('');
    setOpponent('');
    setError('');
  }

  function reset() {
    setSelectedType(null);
    setTitle('');
    setContent('');
    setEventDate('');
    setEventTime('');
    setLocation('');
    setOpponent('');
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await addAnnouncement({
        title,
        content,
        type: selectedType!,
        event_date: eventDate || null,
        event_time: eventTime || null,
        location: location || null,
        opponent: opponent || null,
      });
      if (result.ok) {
        reset();
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to create');
      }
    });
  }

  // Template picker
  if (!selectedType) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TEMPLATES.map(tpl => (
          <button
            key={tpl.type}
            onClick={() => selectTemplate(tpl.type)}
            className={`border-2 rounded p-4 text-center transition ${tpl.color}`}
          >
            <span className="text-2xl block">{tpl.icon}</span>
            <span className="text-sm font-bold uppercase tracking-wide text-[var(--text)] mt-1 block font-[family-name:var(--font-display)]">
              {tpl.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  const isEvent = selectedType === 'match' || selectedType === 'training' || selectedType === 'social';
  const tpl = TEMPLATES.find(t => t.type === selectedType)!;

  return (
    <form onSubmit={handleSubmit} className={`border-2 rounded p-4 space-y-3 ${tpl.color.split(' ')[0]} bg-white/25 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wide text-[var(--text)] font-[family-name:var(--font-display)]">
          {tpl.icon} New {tpl.label}
        </span>
        <button type="button" onClick={reset} className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition">
          ← Back
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={selectedType === 'match' ? 'e.g. vs York St John' : selectedType === 'training' ? 'e.g. Training Session' : selectedType === 'social' ? 'e.g. Team Night Out' : 'Title'}
        maxLength={100}
        className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
      />

      {selectedType === 'match' && (
        <input
          type="text"
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          placeholder="Opponent team name"
          maxLength={100}
          className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
        />
      )}

      {isEvent && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
          />
          <input
            type="time"
            value={eventTime}
            onChange={e => setEventTime(e.target.value)}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
          />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location"
            maxLength={100}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)] col-span-2 sm:col-span-1"
          />
        </div>
      )}

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={selectedType === 'match' ? 'Match details, meeting point, kit info...' : selectedType === 'training' ? 'What to bring, focus areas...' : selectedType === 'social' ? 'What to expect, dress code, cost...' : 'Details...'}
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
          onClick={reset}
          className="border border-[var(--border)] text-[var(--text-muted)] text-sm rounded px-4 py-2 hover:border-[var(--gold)] transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
