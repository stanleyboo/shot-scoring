import { redirect } from 'next/navigation';
import { isAdmin, getSettings } from '@/lib/auth';
import { getDb, getTeamSummaries } from '@/lib/db';
import AdminSettings from '@/components/AdminSettings';
import LogoutButton from '@/components/LogoutButton';
import AddTeamForm from '@/components/AddTeamForm';
import TeamList from '@/components/TeamList';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/login');

  const settings = getSettings();
  const teams = getTeamSummaries(getDb());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-50">Admin Settings</h1>
        <LogoutButton />
      </div>

      <AdminSettings settings={settings} />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-yellow-300">Team Setup</h2>
        <AddTeamForm />
        <TeamList teams={teams} />
      </section>
    </div>
  );
}
