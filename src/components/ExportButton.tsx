'use client';

import { useTransition } from 'react';
import { exportSessionCsv } from '@/actions/export';

interface Props {
  sessionId: number;
  sessionName: string | null;
  sessionDate: string;
}

export default function ExportButton({ sessionId, sessionName, sessionDate }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportSessionCsv(sessionId);
      const date = new Date(sessionDate).toISOString().split('T')[0];
      const filename = `${(sessionName ?? 'session').replace(/\s+/g, '-')}-${date}.csv`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-4 py-3 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
    >
      {isPending ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
