'use client';

import { useState, useTransition } from 'react';
import { submitFeedback } from '@/actions/feedback';
import { useToast } from './ToastProvider';

export default function FeedbackForm() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    startTransition(async () => {
      try {
        await submitFeedback(name, message);
        setName('');
        setMessage('');
        toast('Feedback sent!');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to send feedback');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="fb-name" className="block text-sm font-medium text-[var(--text-muted)] mb-1">
          Your name
        </label>
        <input
          id="fb-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          required
          disabled={isPending}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30 disabled:opacity-50"
        />
      </div>
      <div>
        <label htmlFor="fb-message" className="block text-sm font-medium text-[var(--text-muted)] mb-1">
          Message
        </label>
        <textarea
          id="fb-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Feature request, bug report, or question..."
          required
          rows={4}
          disabled={isPending}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/30 disabled:opacity-50 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !name.trim() || !message.trim()}
        className="bg-[var(--gold)] text-black font-bold rounded px-5 py-2.5 hover:bg-[var(--gold-hover)] active:scale-[0.98] disabled:opacity-50 transition-all"
      >
        {isPending ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  );
}
