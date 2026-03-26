import { redirect } from 'next/navigation';
import { getDb, getAnnouncements } from '@/lib/db';
import { getSettings, isAdmin } from '@/lib/auth';
import AnnouncementList from '@/components/AnnouncementList';
import AnnouncementForm from '@/components/AnnouncementForm';

export const dynamic = 'force-dynamic';

export default async function UpdatesPage() {
  const settings = getSettings();
  if (!settings.feature_updates) redirect('/');

  const db = getDb();
  const announcements = getAnnouncements(db);
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Updates</h1>
        <p className="text-sm text-[var(--text-muted)]">Club announcements, upcoming matches, and training sessions.</p>
      </div>

      {admin && <AnnouncementForm />}

      <AnnouncementList announcements={announcements} isAdmin={admin} />
    </div>
  );
}
