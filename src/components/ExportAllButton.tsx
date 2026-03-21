'use client';

import { useTransition } from 'react';
import { exportAllSessionsCsv } from '@/actions/export';

export default function ExportAllButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportAllSessionsCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-sessions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="border border-[var(--border)] bg-transparent text-[var(--text-muted)] rounded px-4 py-2 text-sm hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:opacity-50 transition-all"
    >
      {isPending ? 'Exporting...' : 'Export All CSV'}
    </button>
  );
}
