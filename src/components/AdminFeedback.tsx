'use client';

import { useTransition } from 'react';
import { markFeedbackRead, deleteFeedback } from '@/actions/feedback';
import type { Feedback } from '@/lib/db';

interface Props {
  feedback: Feedback[];
}

export default function AdminFeedback({ feedback }: Props) {
  const [isPending, startTransition] = useTransition();

  if (feedback.length === 0) {
    return <p className="text-sm text-[var(--text-dim)]">No feedback yet.</p>;
  }

  function handleRead(id: number) {
    startTransition(async () => {
      await markFeedbackRead(id);
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteFeedback(id);
    });
  }

  const unread = feedback.filter(f => !f.read);

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
          {unread.length} unread
        </p>
      )}
      {feedback.map(item => (
        <div
          key={item.id}
          className={`border rounded px-4 py-3 space-y-1 gold-accent ${
            item.read ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-[var(--gold)]/30 bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--text-muted)]">{item.name}</p>
              <p className="text-xs text-[var(--text-dim)]">
                {new Date(item.created_at).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!item.read && (
                <button
                  onClick={() => handleRead(item.id)}
                  disabled={isPending}
                  className="text-xs text-[var(--gold)] hover:text-[var(--gold-hover)] disabled:opacity-50"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-xs text-[var(--red)] hover:text-[var(--red-hover)] disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
