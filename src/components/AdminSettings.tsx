'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminSetting } from '@/actions/auth';
import type { AppSettings, PageVisibility } from '@/lib/auth';

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

const VISIBILITY_OPTIONS: { value: PageVisibility; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'admin', label: 'Admin only' },
  { value: 'off', label: 'Off' },
];

function VisibilityPicker({ label, description, value, onChange, disabled }: {
  label: string;
  description: string;
  value: PageVisibility;
  onChange: (v: PageVisibility) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-[var(--border)] bg-white/25 backdrop-blur-sm p-4 gold-accent">
      <div>
        <p className="font-medium text-[var(--text)]">{label}</p>
        <p className="text-sm text-[var(--text-dim)]">{description}</p>
      </div>
      <div className="flex rounded overflow-hidden border border-[var(--border)] flex-shrink-0">
        {VISIBILITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
              value === opt.value
                ? opt.value === 'off'
                  ? 'bg-[var(--red)] text-white'
                  : opt.value === 'admin'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[var(--gold)] text-[var(--bg)]'
                : 'bg-transparent text-[var(--text-dim)] hover:text-[var(--text-muted)]'
            } disabled:opacity-50`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const PAGE_SETTINGS: { key: keyof AppSettings; label: string; description: string }[] = [
  { key: 'page_matches', label: 'Matches', description: 'Match list and scoring pages' },
  { key: 'page_players', label: 'Players', description: 'Player profiles and management' },
  { key: 'page_teams', label: 'Teams', description: 'Team pages and team stats' },
  { key: 'page_stats', label: 'Stats', description: 'Leaderboards and stat management' },
  { key: 'page_feedback', label: 'Feedback', description: 'Feedback submission page' },
  { key: 'page_social', label: 'Social / Chat', description: 'Message board for players' },
  { key: 'page_updates', label: 'Updates & Fixtures', description: 'Club announcements and match fixtures' },
];

export default function AdminSettings({ settings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: keyof AppSettings) {
    startTransition(async () => {
      await updateAdminSetting(key, !settings[key]);
      router.refresh();
    });
  }

  function handleVisibility(key: keyof AppSettings, value: PageVisibility) {
    startTransition(async () => {
      await updateAdminSetting(key, value);
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

      <h2 className="text-lg font-semibold text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase tracking-wide mt-6">Page Visibility</h2>
      <p className="text-sm text-[var(--text-dim)]">Control who can see each section. &ldquo;Admin only&rdquo; pages are visible only when logged in.</p>
      {PAGE_SETTINGS.map(ps => (
        <VisibilityPicker
          key={ps.key}
          label={ps.label}
          description={ps.description}
          value={settings[ps.key] as PageVisibility}
          onChange={v => handleVisibility(ps.key, v)}
          disabled={isPending}
        />
      ))}
    </div>
  );
}
