'use server';

import { getDb, getSessionWithStats, getAllStatTypes } from '@/lib/db';
import type { Session } from '@/lib/db';

export async function exportSessionCsv(sessionId: number): Promise<string> {
  const db = getDb();
  const data = getSessionWithStats(db, sessionId);
  if (!data) throw new Error('Session not found');

  const statTypes = getAllStatTypes(db);
  const { players } = data;
  const homePlayers = players.filter(p => !p.is_opposition);

  const headers = ['Player', 'Made', 'Attempted', '%', ...statTypes.map(st => st.name)];
  const rows = homePlayers.map(p => {
    const pct = p.attempted === 0 ? '0' : Math.round((p.made / p.attempted) * 100).toString();
    return [
      p.name,
      p.made.toString(),
      p.attempted.toString(),
      pct,
      ...statTypes.map(st => (p.stat_counts[st.id] ?? 0).toString()),
    ];
  });

  const csvLines = [headers.join(','), ...rows.map(r => r.join(','))];
  return csvLines.join('\n');
}

export async function exportAllSessionsCsv(): Promise<string> {
  const db = getDb();
  const statTypes = getAllStatTypes(db);
  const sessions = db.prepare(
    `SELECT s.*, t.name AS team_name FROM sessions s JOIN teams t ON t.id = s.team_id WHERE s.ended_at IS NOT NULL ORDER BY s.started_at DESC`
  ).all() as (Session & { team_name: string })[];

  const headers = ['Session', 'Team', 'Date', 'Player', 'Made', 'Attempted', '%', ...statTypes.map(st => st.name)];
  const rows: string[][] = [];

  for (const session of sessions) {
    const data = getSessionWithStats(db, session.id);
    if (!data) continue;
    const homePlayers = data.players.filter(p => !p.is_opposition);
    for (const p of homePlayers) {
      const pct = p.attempted === 0 ? '0' : Math.round((p.made / p.attempted) * 100).toString();
      rows.push([
        `"${(session.name ?? 'Training Session').replace(/"/g, '""')}"`,
        `"${session.team_name}"`,
        new Date(session.started_at).toISOString().split('T')[0],
        p.name,
        p.made.toString(),
        p.attempted.toString(),
        pct,
        ...statTypes.map(st => (p.stat_counts[st.id] ?? 0).toString()),
      ]);
    }
  }

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
