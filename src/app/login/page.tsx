import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text)] font-[family-name:var(--font-display)] uppercase tracking-wide">Admin Login</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            Enter the admin password to manage players, sessions, and settings.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
