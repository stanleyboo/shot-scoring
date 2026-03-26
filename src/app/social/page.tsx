import { redirect } from 'next/navigation';
import { getDb, getMessages, getMessageCount } from '@/lib/db';
import { getSettings, isAdmin } from '@/lib/auth';
import MessageFeed from '@/components/MessageFeed';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const settings = getSettings();
  if (!settings.feature_social) redirect('/');

  const db = getDb();
  const messages = getMessages(db);
  const totalCount = getMessageCount(db);
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] uppercase tracking-wide">Social</h1>
        <p className="text-sm text-[var(--text-muted)]">Chat with your teammates. {totalCount} message{totalCount !== 1 ? 's' : ''} so far.</p>
      </div>
      <MessageFeed messages={messages} isAdmin={admin} />
    </div>
  );
}
