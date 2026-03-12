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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-stone-800 bg-[#111] p-4">
      <div>
        <p className="font-medium text-stone-50">{label}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative h-7 w-12 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-yellow-400' : 'bg-stone-700'
        } disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full ${checked ? 'bg-black' : 'bg-white'} transition-transform ${
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
      <h2 className="text-lg font-semibold text-stone-300">Public Access</h2>
      <p className="text-sm text-stone-500">Control what visitors can do without logging in.</p>
      <Toggle
        label="Anyone can create matches"
        description="When off, only admins can start new sessions"
        checked={settings.public_can_create}
        onChange={() => handleToggle('public_can_create')}
        disabled={isPending}
      />
      <Toggle
        label="Anyone can edit matches"
        description="When off, only admins can record shots, reopen sessions, and edit scores"
        checked={settings.public_can_edit}
        onChange={() => handleToggle('public_can_edit')}
        disabled={isPending}
      />
    </div>
  );
}
