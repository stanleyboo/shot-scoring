import { redirect } from 'next/navigation';
import { isAdmin, getSettings } from '@/lib/auth';
import { getDb, getDeletedSessions, getDeletedPlayers, getDeletedTeams, getAllFeedback } from '@/lib/db';
import AdminSettings from '@/components/AdminSettings';
import LogoutButton from '@/components/LogoutButton';
import RecoveryPanel from '@/components/RecoveryPanel';
import AdminFeedback from '@/components/AdminFeedback';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/login');

  const db = getDb();
  const settings = getSettings();
  const deletedSessions = getDeletedSessions(db);
  const deletedPlayers = getDeletedPlayers(db);
  const deletedTeams = getDeletedTeams(db);
  const feedback = getAllFeedback(db);
  const unreadCount = feedback.filter(f => !f.read).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase tracking-wide">Admin Settings</h1>
        <LogoutButton />
      </div>

      <AdminSettings settings={settings} />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">
          Feedback {unreadCount > 0 && <span className="text-sm text-[var(--text-muted)]">({unreadCount} new)</span>}
        </h2>
        <AdminFeedback feedback={feedback} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--gold)] font-[family-name:var(--font-display)] uppercase">Recovery</h2>
        <p className="text-sm text-[var(--text-muted)]">Restore recently deleted matches, players, or teams.</p>
        <RecoveryPanel
          sessions={deletedSessions}
          players={deletedPlayers}
          teams={deletedTeams}
        />
      </section>
    </div>
  );
}
