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
    return <p className="text-sm text-stone-500">No feedback yet.</p>;
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
  const read = feedback.filter(f => f.read);

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {unread.length} unread
        </p>
      )}
      {feedback.map(item => (
        <div
          key={item.id}
          className={`border rounded-lg px-4 py-3 space-y-1 ${
            item.read ? 'border-stone-800 bg-[#111]' : 'border-yellow-400/30 bg-[#111]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-stone-200">{item.name}</p>
              <p className="text-xs text-stone-500">
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
                  className="text-xs text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="text-sm text-stone-300 whitespace-pre-wrap">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
