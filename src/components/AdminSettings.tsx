'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminSetting } from '@/actions/auth';
import type { AppSettings } from '@/lib/auth';

interface Props {
  settings: AppSettings;
}

function Toggle({ label, description, checked, onChange, disabled }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-[var(--border)] bg-white/25 backdrop-blur-sm p-4 gold-accent">
      <div>
        <p className="font-medium text-[var(--text)]">{label}</p>
        <p className="text-sm text-[var(--text-dim)]">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative h-7 w-12 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'
        } disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-[var(--bg)] shadow transition-transform ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`} />
      </button>
    </div>
  );
}

export default function AdminSettings({ settings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: keyof AppSettings) {
    startTransition(async () => {
      await updateAdminSetting(key, !settings[key]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase tracking-wide">Public Access</h2>
      <p className="text-sm text-[var(--text-dim)]">Control what visitors can do without logging in.</p>
      <Toggle
        label="Anyone can create matches"
        description="When off, only admins can start new sessions"
        checked={settings.public_can_create}
        onChange={() => handleToggle('public_can_create')}
        disabled={isPending}
      />
      <Toggle
        label="Anyone can edit ended matches"
        description="When off, only admins can reopen ended sessions and modify completed match data. Live matches can always be edited by anyone."
        checked={settings.public_can_edit}
        onChange={() => handleToggle('public_can_edit')}
        disabled={isPending}
      />

      <h2 className="text-lg font-semibold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase tracking-wide mt-6">Features</h2>
      <p className="text-sm text-[var(--text-dim)]">Toggle sections on and off. Disabled features are hidden from everyone.</p>
      <Toggle
        label="Social / Chat"
        description="Message board where players can post messages using their name."
        checked={settings.feature_social}
        onChange={() => handleToggle('feature_social')}
        disabled={isPending}
      />
      <Toggle
        label="Updates & Fixtures"
        description="Announcements section for match fixtures, training sessions, and club updates."
        checked={settings.feature_updates}
        onChange={() => handleToggle('feature_updates')}
        disabled={isPending}
      />
    </div>
  );
}
