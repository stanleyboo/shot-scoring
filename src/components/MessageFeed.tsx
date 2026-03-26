'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postMessage, removeMessage } from '@/actions/social';
import type { Message } from '@/lib/db';

interface Props {
  messages: Message[];
  isAdmin: boolean;
}

export default function MessageFeed({ messages, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // Restore name from localStorage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('social_name');
      if (saved) setAuthor(saved);
    }
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!author.trim() || !content.trim()) {
      setError('Name and message are required');
      return;
    }
    startTransition(async () => {
      localStorage.setItem('social_name', author.trim());
      const result = await postMessage(author, content);
      if (result.ok) {
        setContent('');
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to send');
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this message?')) return;
    startTransition(async () => {
      await removeMessage(id);
      router.refresh();
    });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="space-y-4">
      {/* Post form */}
      <form onSubmit={handleSubmit} className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded p-4 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm w-32 sm:w-40 focus:outline-none focus:border-[var(--gold)]"
          />
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a message..."
            maxLength={500}
            className="border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-[var(--gold)]"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--gold)] text-[var(--bg)] font-bold text-sm uppercase tracking-wide rounded px-4 py-2 hover:bg-[var(--gold-hover)] transition disabled:opacity-50 flex-shrink-0"
          >
            Send
          </button>
        </div>
        {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      </form>

      {/* Messages */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="border border-dashed border-[var(--gold)]/30 bg-white/25 backdrop-blur-sm rounded p-8 text-center text-[var(--text-dim)]">
            No messages yet. Be the first to say something!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="border border-[var(--border)] bg-white/25 backdrop-blur-sm rounded px-4 py-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">{msg.author}</span>
                  <span className="text-[11px] text-[var(--text-dim)]">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-sm text-[var(--text)] mt-0.5 break-words">{msg.content}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(msg.id)}
                  disabled={isPending}
                  className="text-[var(--text-dim)] hover:text-[var(--red)] transition text-xs flex-shrink-0"
                  title="Delete message"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
