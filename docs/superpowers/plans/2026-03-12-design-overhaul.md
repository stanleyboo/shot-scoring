# ShotScore Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the visual design system, improve UX polish, and add quality-of-life features across the ShotScore netball app.

**Architecture:** Three independent phases, each shippable. Phase 1 standardizes the design system (colors, fonts, inputs, buttons, nav). Phase 2 adds UX polish (modals, toasts, empty states, breadcrumbs). Phase 3 adds QoL features (CSV export, search, player archive, PWA).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, better-sqlite3, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-12-design-overhaul-design.md`

---

## Chunk 1: Phase 1 — Design System & Consistency

### Task 1: Add Inter font via next/font

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Inter font to layout.tsx**

In `src/app/layout.tsx`, add the Inter import and apply it to the body:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
});
```

Update the `<body>` tag to use the font class:
```tsx
<body className={`${inter.className} min-h-screen antialiased`}>
```

- [ ] **Step 2: Update globals.css font-family**

In `src/app/globals.css`, change the body font-family from `"Arial Black", "Segoe UI", sans-serif` to just remove it entirely (next/font handles it via className). The body block should only keep:
```css
body {
  min-height: 100vh;
  background: var(--page-bg);
  color: #fafaf9;
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 3: Verify build**

Run: `cd /home/pi/projects/shot-scoring && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: switch font from Arial Black to Inter via next/font"
```

---

### Task 2: Create NavLinks client component for active states

**Files:**
- Modify: `src/components/Nav.tsx`
- Create: `src/components/NavLinks.tsx`

- [ ] **Step 1: Create NavLinks.tsx**

Create `src/components/NavLinks.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  isAdmin: boolean;
}

const links = [
  { href: '/sessions', label: 'Matches' },
  { href: '/players', label: 'Players' },
  { href: '/stats', label: 'Stats' },
];

export default function NavLinks({ isAdmin }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex gap-5 text-sm">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive(link.href)
              ? 'text-yellow-300 border-yellow-400'
              : 'text-stone-300 border-transparent hover:text-yellow-300'
          }`}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin ? (
        <Link
          href="/admin"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive('/admin')
              ? 'text-yellow-300 border-yellow-400'
              : 'text-yellow-300/70 border-transparent hover:text-yellow-200'
          }`}
        >
          Admin
        </Link>
      ) : (
        <Link
          href="/login"
          className={`font-bold uppercase tracking-wide py-2 transition border-b-2 ${
            isActive('/login')
              ? 'text-stone-300 border-yellow-400'
              : 'text-stone-500 border-transparent hover:text-stone-300'
          }`}
        >
          Login
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update Nav.tsx to use NavLinks**

Replace the nav links `<div>` in `src/components/Nav.tsx` with:

```tsx
import NavLinks from './NavLinks';

// ... keep the existing async function and isAdmin() call

// Replace the <div className="flex gap-5 text-sm"> block with:
<NavLinks isAdmin={admin} />
```

The full updated Nav.tsx:
```tsx
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import NavLinks from './NavLinks';

export default async function Nav() {
  const admin = await isAdmin();

  return (
    <nav className="border-b-2 border-yellow-400 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="bg-yellow-400 px-3 py-2 text-xl font-black uppercase tracking-[0.18em] text-black transition hover:bg-yellow-300">
          Langwith Netball
        </Link>
        <NavLinks isAdmin={admin} />
      </div>
    </nav>
  );
}
```

Note: border-b changed from `border-b-4` to `border-b-2` for the softer refined look.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.tsx src/components/NavLinks.tsx
git commit -m "feat: add active nav states via NavLinks client component"
```

---

### Task 3: Standardize all form inputs

**Files:**
- Modify: `src/components/AddPlayerForm.tsx`
- Modify: `src/components/AddTeamForm.tsx`
- Modify: `src/components/AddStatTypeForm.tsx`
- Modify: `src/components/LoginForm.tsx`
- Modify: `src/components/NewSessionForm.tsx`

The standard input classes are:
```
bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

- [ ] **Step 1: Update AddPlayerForm.tsx inputs**

In `src/components/AddPlayerForm.tsx`:

Change the text input className (line 35) from:
```
flex-1 border-2 border-stone-900 bg-black px-4 py-3 text-white placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none
```
to:
```
flex-1 bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the select className (line 42) from:
```
border-2 border-stone-900 bg-black px-4 py-3 text-white focus:border-yellow-500 focus:outline-none
```
to:
```
bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the submit button className (line 54) from:
```
border-2 border-yellow-400 bg-yellow-400 px-5 py-3 font-black uppercase tracking-wide text-black transition hover:bg-yellow-300 disabled:opacity-50
```
to:
```
bg-yellow-400 text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

- [ ] **Step 2: Update AddTeamForm.tsx**

In `src/components/AddTeamForm.tsx`:

Change the input className (line 33) from:
```
flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none
```
to:
```
flex-1 bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the button className (line 40) from:
```
rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50
```
to:
```
bg-yellow-400 text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

- [ ] **Step 3: Update AddStatTypeForm.tsx**

In `src/components/AddStatTypeForm.tsx`:

Change the input className (line 33) from:
```
flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none
```
to:
```
flex-1 bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the button className (line 40) from:
```
rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors
```
to:
```
bg-yellow-400 text-black font-bold rounded-lg px-5 py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

- [ ] **Step 4: Update LoginForm.tsx**

In `src/components/LoginForm.tsx`:

Change the input className (line 37) from:
```
w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
```
to:
```
w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the button className (line 46) from:
```
w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors
```
to:
```
w-full bg-yellow-400 text-black font-bold rounded-lg py-3 hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

- [ ] **Step 5: Update NewSessionForm.tsx inputs**

In `src/components/NewSessionForm.tsx`:

Change the select className (line 70) from:
```
w-full border-2 border-stone-900 bg-black px-4 py-3 text-white focus:border-yellow-500 focus:outline-none
```
to:
```
w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the text input className (line 88) from:
```
w-full border-2 border-stone-900 bg-black px-4 py-3 text-white placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none
```
to:
```
w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Update the player toggle buttons (line 112-116) to use rounded-lg:
Change `border-2` to `border` in both selected and unselected states.
Selected: `border-yellow-400 bg-[#222000] text-white rounded-lg`
Unselected: `border-stone-800 bg-[#111] text-stone-200 hover:border-yellow-400 rounded-lg`

Update the submit button (line 143) from:
```
w-full border-2 border-yellow-400 bg-yellow-400 py-4 text-xl font-black uppercase tracking-wide text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50
```
to:
```
w-full bg-yellow-400 text-black font-bold rounded-lg py-4 text-xl hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/AddPlayerForm.tsx src/components/AddTeamForm.tsx src/components/AddStatTypeForm.tsx src/components/LoginForm.tsx src/components/NewSessionForm.tsx
git commit -m "feat: standardize all form inputs and buttons to unified design system"
```

---

### Task 4: Restyle admin components (AdminSettings, LogoutButton, StatTypeList)

**Files:**
- Modify: `src/components/AdminSettings.tsx`
- Modify: `src/components/LogoutButton.tsx`
- Modify: `src/components/StatTypeList.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Update AdminSettings.tsx toggle colors**

In `src/components/AdminSettings.tsx`:

Change the Toggle container className (line 20) from:
```
flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-4
```
to:
```
flex items-center justify-between gap-4 rounded-lg border border-stone-800 bg-[#111] p-4
```

Change the toggle button `checked` color (line 29) from `bg-indigo-600` to `bg-yellow-400`.
Change the toggle knob color (line 32): when checked, the knob should be `bg-black` (on yellow). When unchecked, `bg-white`.

The full toggle button:
```tsx
<button
  onClick={onChange}
  disabled={disabled}
  className={`relative h-7 w-12 rounded-full transition-colors flex-shrink-0 ${
    checked ? 'bg-yellow-400' : 'bg-stone-700'
  } disabled:opacity-50`}
>
  <span className={`absolute top-0.5 h-6 w-6 rounded-full transition-transform ${
    checked ? 'left-[22px] bg-black' : 'left-0.5 bg-white'
  }`} />
</button>
```

Change the section heading (line 53) from `text-lg font-semibold text-slate-300` to `text-lg font-semibold text-stone-300`.

Change the description (line 54) from `text-sm text-slate-500` to `text-sm text-stone-500`.

Change Toggle label (line 22) from `text-slate-100` to `text-stone-50`.
Change Toggle description (line 23) from `text-sm text-slate-500` to `text-sm text-stone-500`.

- [ ] **Step 2: Update LogoutButton.tsx**

In `src/components/LogoutButton.tsx`, change the button className (line 19) from:
```
rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors
```
to:
```
border border-stone-800 bg-transparent text-stone-300 rounded-lg px-3 py-1.5 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all
```

- [ ] **Step 3: Update StatTypeList.tsx**

In `src/components/StatTypeList.tsx`:

Change the empty state (line 49) from `text-slate-500` to `text-stone-500`.

Change the divider (line 55) from `divide-slate-800` to `divide-stone-800`.

Change stat name text (line 86) from `text-slate-100` to `text-stone-50`.

Change the rename input (line 66) from:
```
flex-1 rounded-lg border border-indigo-500 bg-slate-800 px-3 py-1.5 text-slate-100 focus:outline-none
```
to:
```
flex-1 bg-[#111] border border-stone-800 rounded-lg px-3 py-1.5 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change the Save button (line 72) from:
```
rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors
```
to:
```
bg-yellow-400 text-black font-bold rounded-lg px-3 py-1.5 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

Change the Cancel button (line 80) from `text-slate-400 hover:text-slate-200` to `text-stone-400 hover:text-stone-200`.

Change the Rename link (line 94) from `text-slate-400 hover:text-slate-200` to `text-stone-400 hover:text-stone-300`.

Change the Delete link (line 101) from `text-slate-600 hover:text-red-400` to `text-stone-600 hover:text-red-400`.

- [ ] **Step 4: Update login page text colors**

In `src/app/login/page.tsx`:

Change `text-slate-100` (line 12) to `text-stone-50`.
Change `text-slate-500` (line 13) to `text-stone-500`.

- [ ] **Step 5: Update admin page text colors**

In `src/app/admin/page.tsx`:

Change `text-slate-100` (line 20) to `text-stone-50`.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/AdminSettings.tsx src/components/LogoutButton.tsx src/components/StatTypeList.tsx src/app/login/page.tsx src/app/admin/page.tsx
git commit -m "feat: restyle admin/login to stone/yellow palette, remove slate/indigo"
```

---

### Task 5: Restyle remaining components with slate/indigo references

**Files:**
- Modify: `src/components/RenameSessionForm.tsx`
- Modify: `src/components/ReopenSessionButton.tsx`
- Modify: `src/components/DeleteSessionButton.tsx`
- Modify: `src/components/PlayerList.tsx`
- Modify: `src/components/TeamList.tsx`
- Modify: `src/components/SessionTeamForm.tsx`

- [ ] **Step 1: Update RenameSessionForm.tsx**

In `src/components/RenameSessionForm.tsx`:

Change heading (line 33) from `text-slate-100` to `text-stone-50`.
Change Rename button (line 37) from `text-slate-500 hover:text-slate-300` to `text-stone-500 hover:text-stone-300`.

Change the input (line 54) from:
```
rounded-lg border border-indigo-500 bg-slate-800 px-3 py-1.5 text-lg font-bold text-slate-100 placeholder-slate-500 focus:outline-none
```
to:
```
bg-[#111] border border-stone-800 rounded-lg px-3 py-1.5 text-lg font-bold text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change Save button (line 60) from:
```
rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors
```
to:
```
bg-yellow-400 text-black font-bold rounded-lg px-3 py-1.5 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

Change Cancel button (line 68) from `text-slate-400 hover:text-slate-200` to `text-stone-400 hover:text-stone-200`.

- [ ] **Step 2: Update ReopenSessionButton.tsx**

In `src/components/ReopenSessionButton.tsx`:

Change button className (line 22) from:
```
flex-1 rounded-xl border border-slate-600 py-3 text-center text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors
```
to:
```
flex-1 border border-stone-800 bg-transparent text-stone-300 rounded-lg py-3 text-center hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all
```

- [ ] **Step 3: Update DeleteSessionButton.tsx**

In `src/components/DeleteSessionButton.tsx`:

Change button className (line 29) from:
```
rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40 transition-colors
```
to:
```
rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40 transition-all
```

- [ ] **Step 4: Update PlayerList.tsx inline edit input**

In `src/components/PlayerList.tsx`:

Change the rename input (line 91) from:
```
flex-1 border-2 border-yellow-400 bg-black px-3 py-2 text-white focus:outline-none
```
to:
```
flex-1 bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change Save button (line 97) to use standard primary:
```
bg-yellow-400 text-black font-bold rounded-lg px-3 py-2 text-sm hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50 transition-all
```

Change Cancel button (line 105) to use ghost:
```
border border-stone-800 bg-transparent text-stone-300 rounded-lg px-3 py-2 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all
```

Change the team select (line 129) from:
```
border-2 border-stone-700 bg-black px-3 py-2 text-sm text-yellow-300 focus:border-yellow-400 focus:outline-none
```
to:
```
bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-sm text-yellow-300 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

Change Stats button (line 152), Rename button (line 161), and Delete button (line 166) to use rounded-lg and `border` instead of `border-2`.

- [ ] **Step 5: Update TeamList.tsx**

In `src/components/TeamList.tsx`:

Change card container (line 47) from `border-2 border-stone-900` to `border border-stone-800 rounded-lg`.
Change rename input (line 57) from `border-2 border-yellow-400 bg-black` to standard input style.
Change Save/Cancel buttons to standard primary/ghost styles with rounded-lg.
Change "Open Team" button (line 98) to use `rounded-lg` and `border` instead of `border-2`.
Change "Rename Team" button (line 106) to use `rounded-lg` and `border` instead of `border-2`.

- [ ] **Step 6: Update SessionTeamForm.tsx select**

In `src/components/SessionTeamForm.tsx`:

Change the select (line 36) from:
```
border-2 border-stone-700 bg-black px-3 py-2 text-sm text-yellow-300 focus:border-yellow-400 focus:outline-none
```
to:
```
bg-[#111] border border-stone-800 rounded-lg px-3 py-2 text-sm text-yellow-300 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/RenameSessionForm.tsx src/components/ReopenSessionButton.tsx src/components/DeleteSessionButton.tsx src/components/PlayerList.tsx src/components/TeamList.tsx src/components/SessionTeamForm.tsx
git commit -m "feat: standardize remaining components to unified design system"
```

---

### Task 6: Soften main page cards and borders

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/sessions/page.tsx`
- Modify: `src/app/players/page.tsx`
- Modify: `src/components/LeaderboardSection.tsx`
- Modify: `src/components/ScoringBoard.tsx`
- Modify: `src/components/PlayerScoreCard.tsx`

- [ ] **Step 1: Update dashboard cards (page.tsx)**

In `src/app/page.tsx`, apply the refined style throughout:

Line 44: Hero section — change `border-4 border-yellow-400` to `border-2 border-yellow-400 rounded-lg`.
Line 73: Stat cards — change `border-2 border-stone-900 bg-black` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 92: Team cards — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 92: Team card hover — change `hover:border-yellow-400 hover:bg-black` to `hover:border-yellow-400`.
Line 137: Match rows — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 162: Empty state — change `border-2 border-dashed border-yellow-400/30 bg-black` to `border border-dashed border-yellow-400/30 bg-[#111] rounded-lg`.
Line 173: Club leader cards — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 186: CTA button — change `border-2 border-yellow-400 bg-yellow-400` to `bg-yellow-400 rounded-lg`.

Reduce letter-spacing on labels from `tracking-[0.35em]` to `tracking-[0.1em]` and `tracking-[0.2em]` to `tracking-[0.1em]`.

- [ ] **Step 2: Update sessions page cards**

In `src/app/sessions/page.tsx`:

Line 21: "+ New Match" button — change `border-2 border-yellow-400 bg-yellow-400` to `bg-yellow-400 rounded-lg font-bold` and remove `font-black uppercase tracking-wide`.
Line 28: Empty state — change `border-2 border-stone-900 bg-black` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 58: Session rows — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg`.

- [ ] **Step 3: Update players page empty state border**

In `src/components/PlayerList.tsx`:

Line 72: Empty state — change `border-2 border-stone-900 bg-black` to `border border-stone-800 bg-[#111] rounded-lg`.
Line 79: List container — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg overflow-hidden`.
Line 81: List item border — change `border-t-2 border-stone-900` to `border-t border-stone-800`.

- [ ] **Step 4: Update LeaderboardSection.tsx**

In `src/components/LeaderboardSection.tsx`:

Line 19: Card container — change `border-2 border-stone-900 bg-[#111111]` to `border border-stone-800 bg-[#111] rounded-lg overflow-hidden`.
Line 20: Header — change `border-b-2 border-stone-900` to `border-b border-stone-800`.
Line 24: Divider — change `divide-stone-900` to `divide-stone-800`.
Line 74: Toggle button — change `border-2` to `border` and add `rounded-lg`.

- [ ] **Step 5: Update ScoringBoard.tsx borders**

In `src/components/ScoringBoard.tsx`:

Line 150: End Match button — change `rounded-lg border border-yellow-400/20` (keep as-is, already refined).
Line 156: Scoreboard container — keep `rounded-2xl` on mobile, already looks good.

No major changes needed — the scoring board already uses the softer style.

- [ ] **Step 6: Update PlayerScoreCard.tsx borders**

In `src/components/PlayerScoreCard.tsx`:

The card already uses `rounded-2xl border ... bg-black/60` which fits the refined direction. Keep as-is for the scoring board (courtside usability).

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/app/sessions/page.tsx src/components/PlayerList.tsx src/components/LeaderboardSection.tsx src/components/ScoringBoard.tsx src/components/PlayerScoreCard.tsx
git commit -m "feat: soften cards and borders across main pages for refined look"
```

---

## Chunk 2: Phase 2 — UX & Polish

### Task 7: Create ConfirmModal component

**Files:**
- Create: `src/components/ConfirmModal.tsx`

- [ ] **Step 1: Create ConfirmModal.tsx**

Create `src/components/ConfirmModal.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-red-500 active:scale-[0.98] transition-all'
      : 'bg-yellow-400 text-black font-bold rounded-lg px-5 py-2.5 hover:bg-yellow-300 active:scale-[0.98] transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-lg border border-stone-800 bg-[#111] p-6 space-y-4">
        <h3 className="text-lg font-bold text-stone-50">{title}</h3>
        <p className="text-sm text-stone-400">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-5 py-2.5 hover:border-yellow-500 hover:text-yellow-300 transition-all"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={confirmClasses}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfirmModal.tsx
git commit -m "feat: add reusable ConfirmModal component"
```

---

### Task 8: Replace all confirm() calls with ConfirmModal

**Files:**
- Modify: `src/components/ScoringBoard.tsx`
- Modify: `src/components/DeleteSessionButton.tsx`
- Modify: `src/components/PlayerList.tsx`
- Modify: `src/components/StatTypeList.tsx`

- [ ] **Step 1: Update ScoringBoard.tsx**

In `src/components/ScoringBoard.tsx`, add state for the modal and replace `confirm()`:

Add import:
```tsx
import ConfirmModal from './ConfirmModal';
```

Add state after the existing state declarations:
```tsx
const [showEndModal, setShowEndModal] = useState(false);
```

Replace the `handleEnd` function:
```tsx
function handleEnd() {
  setShowEndModal(true);
}

function confirmEnd() {
  setShowEndModal(false);
  startTransition(async () => {
    await endSession(session.id);
    router.push(`/sessions/${session.id}/summary`);
  });
}
```

Note: `useState` is already imported in ScoringBoard.tsx, no import change needed.

Add the modal just before the closing `</div>` of the return:
```tsx
<ConfirmModal
  open={showEndModal}
  title="End Match"
  message="End this session? You can reopen it later to edit shots."
  confirmLabel="End Match"
  variant="primary"
  onConfirm={confirmEnd}
  onCancel={() => setShowEndModal(false)}
/>
```

- [ ] **Step 2: Update DeleteSessionButton.tsx**

In `src/components/DeleteSessionButton.tsx`:

Add import and state:
```tsx
import { useState, useTransition } from 'react';
import ConfirmModal from './ConfirmModal';
```

Add state:
```tsx
const [showModal, setShowModal] = useState(false);
```

Replace `handleDelete`:
```tsx
function handleDelete() {
  setShowModal(true);
}

function confirmDelete() {
  setShowModal(false);
  startTransition(async () => {
    await deleteSession(sessionId);
    if (redirectTo) router.push(redirectTo);
  });
}
```

Add modal before the closing fragment:
```tsx
<>
  <button ...>{/* existing button */}</button>
  <ConfirmModal
    open={showModal}
    title="Delete Session"
    message="Delete this session and all its shots? This cannot be undone."
    confirmLabel="Delete"
    variant="danger"
    onConfirm={confirmDelete}
    onCancel={() => setShowModal(false)}
  />
</>
```

- [ ] **Step 3: Update PlayerList.tsx**

In `src/components/PlayerList.tsx`:

Add import:
```tsx
import ConfirmModal from './ConfirmModal';
```

Add state for delete confirmation:
```tsx
const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; shotCount: number } | null>(null);
```

Replace `handleDelete`:
```tsx
function handleDelete(id: number, name: string, shotCount: number) {
  setDeleteTarget({ id, name, shotCount });
}

function confirmDelete() {
  if (!deleteTarget) return;
  const { id } = deleteTarget;
  setDeleteTarget(null);
  startTransition(async () => {
    try {
      await deletePlayer(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  });
}
```

Add modal at end of return, before closing `</ul>`:
```tsx
<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Player"
  message={
    deleteTarget?.shotCount
      ? `Delete ${deleteTarget.name}? This will remove all their shot history across all sessions.`
      : `Remove ${deleteTarget?.name ?? ''}?`
  }
  confirmLabel="Delete"
  variant="danger"
  onConfirm={confirmDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

- [ ] **Step 4: Update StatTypeList.tsx**

In `src/components/StatTypeList.tsx`:

Add import:
```tsx
import ConfirmModal from './ConfirmModal';
```

Add state:
```tsx
const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
```

Replace `handleDelete`:
```tsx
function handleDelete(id: number, name: string) {
  setDeleteTarget({ id, name });
}

function confirmDelete() {
  if (!deleteTarget) return;
  const { id } = deleteTarget;
  setDeleteTarget(null);
  startTransition(async () => {
    try {
      await deleteStatType(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  });
}
```

Add modal before closing return:
```tsx
<ConfirmModal
  open={deleteTarget !== null}
  title="Delete Stat Type"
  message={`Delete "${deleteTarget?.name ?? ''}"? This will remove all recorded events of this type.`}
  confirmLabel="Delete"
  variant="danger"
  onConfirm={confirmDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/ScoringBoard.tsx src/components/DeleteSessionButton.tsx src/components/PlayerList.tsx src/components/StatTypeList.tsx
git commit -m "feat: replace all native confirm() with styled ConfirmModal"
```

---

### Task 9: Add Toast notification system

**Files:**
- Create: `src/components/ToastProvider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create ToastProvider.tsx**

Create `src/components/ToastProvider.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const borderColor = {
    success: 'border-green-600',
    error: 'border-red-600',
    info: 'border-yellow-400',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
            {toasts.map(t => (
              <div
                key={t.id}
                className={`rounded-lg border ${borderColor[t.variant]} bg-[#111] px-4 py-3 text-sm text-stone-50 shadow-lg animate-[fadeIn_0.2s_ease-out]`}
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Add fadeIn animation to globals.css**

In `src/app/globals.css`, add:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Wrap layout with ToastProvider**

In `src/app/layout.tsx`, wrap the body contents:

```tsx
import ToastProvider from '@/components/ToastProvider';

// In the return, wrap children:
<body className={`${inter.className} min-h-screen antialiased`}>
  <ToastProvider>
    <Nav />
    <main className="mx-auto max-w-7xl px-4 py-8">
      {children}
    </main>
  </ToastProvider>
</body>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/ToastProvider.tsx src/app/globals.css src/app/layout.tsx
git commit -m "feat: add toast notification system"
```

---

### Task 9b: Wire toast notifications to component actions

**Files:**
- Modify: `src/components/AddPlayerForm.tsx`
- Modify: `src/components/AddTeamForm.tsx`
- Modify: `src/components/AddStatTypeForm.tsx`
- Modify: `src/components/ScoringBoard.tsx`

- [ ] **Step 1: Add toast to AddPlayerForm.tsx**

In `src/components/AddPlayerForm.tsx`, add import and call:

```tsx
import { useToast } from './ToastProvider';

// Inside the component:
const { toast } = useToast();

// In the startTransition success path (after setName('')):
toast('Player added');
```

- [ ] **Step 2: Add toast to AddTeamForm.tsx**

Same pattern:
```tsx
import { useToast } from './ToastProvider';
const { toast } = useToast();
// After setName('') in success path:
toast('Team created');
```

- [ ] **Step 3: Add toast to AddStatTypeForm.tsx**

Same pattern:
```tsx
import { useToast } from './ToastProvider';
const { toast } = useToast();
// After setName('') in success path:
toast('Stat type added');
```

- [ ] **Step 4: Add toast to ScoringBoard.tsx for end match**

In `src/components/ScoringBoard.tsx`:
```tsx
import { useToast } from './ToastProvider';
const { toast } = useToast();
// In confirmEnd, before router.push:
toast('Match ended');
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/AddPlayerForm.tsx src/components/AddTeamForm.tsx src/components/AddStatTypeForm.tsx src/components/ScoringBoard.tsx
git commit -m "feat: wire toast notifications to player/team/stat/session actions"
```

---

### Task 10: Restyle session summary tables

**Files:**
- Modify: `src/app/sessions/[id]/summary/page.tsx`

- [ ] **Step 1: Update renderPlayerTable styles**

In `src/app/sessions/[id]/summary/page.tsx`, update the `renderPlayerTable` function:

Change table container (line 76) from:
```
rounded-2xl border border-slate-700 overflow-x-auto
```
to:
```
rounded-lg border border-stone-800 overflow-x-auto
```

Change thead (line 78) from `bg-slate-800` to `bg-[#111]`.

Change th elements (lines 80-88) from `text-slate-400` to `text-stone-400`.

Change tbody divider (line 91) from `divide-slate-700/50` to `divide-stone-800`.

Change tr (line 93) from `bg-slate-800/30 hover:bg-slate-800/60` to `bg-black/30 hover:bg-[#111]`.

Change player link (line 97) from `text-slate-100 hover:text-indigo-400` to `text-stone-50 hover:text-yellow-300`.

Change "Made" column (line 102) from `text-green-400` to `text-yellow-300`.
Change "Attempted" column (line 103) from `text-slate-300` to `text-stone-300`.

Change stat values (line 108) from `text-indigo-400` to `text-yellow-300`.

Change totals row (line 114) from `bg-slate-800/80` to `bg-[#111]`.
Change totals label (line 115) from `text-slate-300` to `text-stone-300`.
Change totals made (line 116) from `text-green-400` to `text-yellow-300`.
Change totals attempted (line 117) from `text-slate-300` to `text-stone-300`.
Change totals stat values (line 122) from `text-indigo-400` to `text-yellow-300`.

Also update the bottom action buttons:
Change "View History" link (line 203) from `rounded-xl border border-yellow-400/15` to `rounded-lg border border-stone-800`.
Change "New Match" link (line 210) from `rounded-xl` to `rounded-lg`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/sessions/[id]/summary/page.tsx
git commit -m "feat: restyle session summary tables to match design system"
```

---

### Task 11: Add Breadcrumb component and apply to deep pages

**Files:**
- Create: `src/components/Breadcrumb.tsx`
- Modify: `src/app/players/[id]/page.tsx`
- Modify: `src/app/sessions/[id]/summary/page.tsx`

- [ ] **Step 1: Create Breadcrumb.tsx**

Create `src/components/Breadcrumb.tsx`:

```tsx
import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-stone-600">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-stone-500 hover:text-yellow-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-yellow-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Add breadcrumb to player profile page**

In `src/app/players/[id]/page.tsx`, replace the back arrow link and heading block (lines 32-44) with:

```tsx
import Breadcrumb from '@/components/Breadcrumb';

// Replace the <div className="flex items-center gap-3"> block with:
<div className="space-y-2">
  <Breadcrumb items={[
    { label: 'Players', href: '/players' },
    { label: player.name },
  ]} />
  <div>
    <h1 className="text-2xl font-bold text-white">{player.name}</h1>
    {stats.team_name && (
      <p className="text-sm text-yellow-300">{stats.team_name}</p>
    )}
  </div>
</div>
```

- [ ] **Step 3: Add breadcrumb to session summary page**

In `src/app/sessions/[id]/summary/page.tsx`, replace the back arrow link (line 137) with a Breadcrumb:

```tsx
import Breadcrumb from '@/components/Breadcrumb';

// At the start of the return, before the existing header block, add:
<Breadcrumb items={[
  { label: 'Matches', href: '/sessions' },
  { label: session.name ?? 'Training Session' },
]} />
```

Remove the `←` link element (the `<Link href="/sessions" className="mt-1.5...">` block).

- [ ] **Step 4: Add breadcrumb to team dashboard page**

In `src/app/teams/[id]/page.tsx` (if it exists), add a breadcrumb at the top:

```tsx
import Breadcrumb from '@/components/Breadcrumb';

// At the start of the return:
<Breadcrumb items={[
  { label: 'Teams' },
  { label: team.name },
]} />
```

Note: Teams don't have a list page, so the first crumb has no href.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/Breadcrumb.tsx src/app/players/[id]/page.tsx src/app/sessions/[id]/summary/page.tsx src/app/teams/[id]/page.tsx
git commit -m "feat: add breadcrumb navigation to player profiles, session summaries, and team dashboards"
```

---

### Task 11b: Add empty states with CTAs

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/stats/page.tsx`
- Modify: `src/app/players/[id]/page.tsx`

- [ ] **Step 1: Add dashboard empty state**

In `src/app/page.tsx`, after the stat cards section (around the Team Breakdown section), add a check for when there's no data. Wrap the existing content after the hero in a conditional:

```tsx
{totalMatches === 0 && players.length === 0 ? (
  <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-12 text-center space-y-4">
    <h2 className="text-xl font-bold text-stone-300">Welcome to Langwith Netball</h2>
    <p className="text-stone-500">Add some players and start your first match to see stats here.</p>
    <div className="flex justify-center gap-4">
      <Link href="/players" className="bg-yellow-400 text-black font-bold rounded-lg px-5 py-2.5 hover:bg-yellow-300 transition-all">
        Add Players
      </Link>
      {creator && (
        <Link href="/sessions/new" className="border border-stone-800 text-stone-300 rounded-lg px-5 py-2.5 hover:border-yellow-500 hover:text-yellow-300 transition-all">
          Start Match
        </Link>
      )}
    </div>
  </div>
) : (
  // ... existing Team Breakdown, Recent Matches, Club Leaders sections
)}
```

- [ ] **Step 2: Add leaderboards empty state**

In `src/app/stats/page.tsx`, the `LeaderboardSection` component already returns null when no visible sections exist. Add an empty state after it:

After the `<LeaderboardSection>` call, add:
```tsx
{sections.every(s => s.match.length === 0 && s.career.length === 0) && (
  <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-12 text-center">
    <p className="text-stone-400">Play some matches to see leaderboards.</p>
    <Link href="/sessions/new" className="mt-3 inline-block text-sm text-yellow-300 hover:text-yellow-200">
      Start a match →
    </Link>
  </div>
)}
```

- [ ] **Step 3: Add player profile empty state**

In `src/app/players/[id]/page.tsx`, after the stats cards section, add a check for when there's no session history:

After the `<PlayerStatsChart>` section and before the table, the existing code already checks `stats.sessions.length > 0` for the table. Add an else clause:

```tsx
{stats.sessions.length === 0 && (
  <div className="border border-dashed border-yellow-400/30 bg-[#111] rounded-lg p-8 text-center">
    <p className="text-stone-400">No match history yet.</p>
  </div>
)}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/stats/page.tsx src/app/players/[id]/page.tsx
git commit -m "feat: add empty states with CTAs on dashboard, leaderboards, and player profile"
```

---

### Task 12: Add getSetting helper and use club_name from DB

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Nav.tsx`

- [ ] **Step 1: Add getSetting helper to db.ts**

In `src/lib/db.ts`, add after the `getDb()` function (around line 243):

```tsx
export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}
```

- [ ] **Step 2: Use club_name in Nav.tsx**

In `src/components/Nav.tsx`:

```tsx
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { getDb, getSetting } from '@/lib/db';
import NavLinks from './NavLinks';

export default async function Nav() {
  const admin = await isAdmin();
  const clubName = getSetting(getDb(), 'club_name') ?? 'Langwith Netball';

  return (
    <nav className="border-b-2 border-yellow-400 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="bg-yellow-400 px-3 py-2 text-xl font-black uppercase tracking-[0.18em] text-black transition hover:bg-yellow-300">
          {clubName}
        </Link>
        <NavLinks isAdmin={admin} />
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Use club_name in dashboard page.tsx**

In `src/app/page.tsx`, replace the hardcoded "Langwith Netball" heading:

Add import:
```tsx
import { getDb, getSetting, ... } from '@/lib/db';
```

Inside the function, add:
```tsx
const clubName = getSetting(db, 'club_name') ?? 'Langwith Netball';
```

Replace the `<h1>` text (line 49) from `Langwith Netball` to `{clubName}`.
Replace the metadata description (line 51) to use `{clubName}`.

- [ ] **Step 4: Use club_name in layout.tsx metadata**

In `src/app/layout.tsx`, update the metadata to be dynamic. Since metadata needs to be static or use `generateMetadata`, and this is a layout, keep the static metadata but note that it will use the default. The Nav component handles the dynamic display.

No change needed for layout metadata — it's acceptable to keep "Langwith Netball" as the static fallback since changing layout metadata to dynamic would require restructuring.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/components/Nav.tsx src/app/page.tsx
git commit -m "feat: use club_name from settings instead of hardcoded values"
```

---

## Chunk 3: Phase 3 — Quality of Life

### Task 13: Add CSV export for sessions

**Files:**
- Create: `src/actions/export.ts`
- Modify: `src/app/sessions/[id]/summary/page.tsx`

- [ ] **Step 1: Create export server action**

Create `src/actions/export.ts`:

```tsx
'use server';

import { getDb, getSessionWithStats, getAllStatTypes } from '@/lib/db';

export async function exportSessionCsv(sessionId: number): Promise<string> {
  const db = getDb();
  const data = getSessionWithStats(db, sessionId);
  if (!data) throw new Error('Session not found');

  const statTypes = getAllStatTypes(db);
  const { session, players } = data;
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
```

- [ ] **Step 2: Add ExportButton client component**

Add to `src/app/sessions/[id]/summary/page.tsx` — create an inline client component or a separate file. For simplicity, create `src/components/ExportButton.tsx`:

```tsx
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
```

- [ ] **Step 3: Add ExportButton to session summary page**

In `src/app/sessions/[id]/summary/page.tsx`, add the export button in the bottom action buttons area (around line 201):

```tsx
import ExportButton from '@/components/ExportButton';

// In the flex gap-3 div at the bottom, add before "View History":
<ExportButton
  sessionId={sessionId}
  sessionName={session.name}
  sessionDate={session.started_at}
/>
```

- [ ] **Step 4: Add exportAllSessionsCsv action**

In `src/actions/export.ts`, add:

```tsx
export async function exportAllSessionsCsv(): Promise<string> {
  const db = getDb();
  const statTypes = getAllStatTypes(db);
  const sessions = db.prepare(
    `SELECT s.*, t.name AS team_name FROM sessions s JOIN teams t ON t.id = s.team_id WHERE s.ended_at IS NOT NULL ORDER BY s.started_at DESC`
  ).all() as (import('@/lib/db').Session & { team_name: string })[];

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
```

- [ ] **Step 5: Add Export All button to sessions page**

The `SessionListPage.tsx` component (created in Task 14) should receive an `onExportAll` callback. Alternatively, create a small `ExportAllButton.tsx`:

Create `src/components/ExportAllButton.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { exportAllSessionsCsv } from '@/actions/export';

export default function ExportAllButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportAllSessionsCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-sessions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="border border-stone-800 bg-transparent text-stone-300 rounded-lg px-4 py-2 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all"
    >
      {isPending ? 'Exporting...' : 'Export All CSV'}
    </button>
  );
}
```

In `src/app/sessions/page.tsx`, add the export button next to the "+ New Match" button:

```tsx
import ExportAllButton from '@/components/ExportAllButton';

// In the header div, add after the New Match link:
{sessions.length > 0 && <ExportAllButton />}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/actions/export.ts src/components/ExportButton.tsx src/components/ExportAllButton.tsx src/app/sessions/[id]/summary/page.tsx src/app/sessions/page.tsx
git commit -m "feat: add CSV export for individual sessions and bulk export all"
```

---

### Task 14: Add search/filter to players and sessions pages

**Files:**
- Create: `src/components/SearchInput.tsx`
- Create: `src/components/PlayerListPage.tsx`
- Create: `src/components/SessionListPage.tsx`
- Modify: `src/app/players/page.tsx`
- Modify: `src/app/sessions/page.tsx`

- [ ] **Step 1: Create SearchInput component**

Create `src/components/SearchInput.tsx`:

```tsx
'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...' }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
    />
  );
}
```

- [ ] **Step 2: Create PlayerListPage client wrapper**

Create `src/components/PlayerListPage.tsx`:

```tsx
'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';
import PlayerList from './PlayerList';
import type { Player, Team } from '@/lib/db';

type PlayerWithShots = Player & { total_shots: number };

interface Props {
  players: PlayerWithShots[];
  teams: Team[];
  canEdit: boolean;
}

export default function PlayerListPage({ players, teams, canEdit }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players;

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search players..."
      />
      <div className="space-y-6">
        {teams.map(team => {
          const teamPlayers = filtered.filter(p => p.team_id === team.id);
          if (teamPlayers.length === 0 && search) return null;
          return (
            <section key={team.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{team.name}</h2>
                <p className="text-sm text-stone-500">{teamPlayers.length} players</p>
              </div>
              <PlayerList players={teamPlayers} teams={teams} canEdit={canEdit} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update players page to use PlayerListPage**

In `src/app/players/page.tsx`, replace the team loop section with the client wrapper:

```tsx
import PlayerListPage from '@/components/PlayerListPage';

// Replace the <div className="space-y-6"> section (lines 37-50) with:
<PlayerListPage players={players} teams={teams} canEdit={admin} />
```

- [ ] **Step 4: Create SessionListPage client wrapper**

Create `src/components/SessionListPage.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchInput from './SearchInput';
import DeleteSessionButton from './DeleteSessionButton';
import type { Session, Team } from '@/lib/db';

type SessionRow = Session & { total_shots: number; player_count: number };

interface Props {
  sessions: SessionRow[];
  teams: Team[];
}

export default function SessionListPage({ sessions, teams }: Props) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const filtered = sessions.filter(s => {
    if (search && !(s.name ?? 'Training Session').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (teamFilter && s.team_id !== Number(teamFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search matches..."
          />
        </div>
        {teams.length > 1 && (
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          >
            <option value="">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-stone-800 bg-[#111] rounded-lg p-12 text-center">
          <p className="text-stone-400">{search || teamFilter ? 'No matches found.' : 'No matches yet.'}</p>
          {!search && !teamFilter && (
            <Link href="/sessions/new" className="mt-3 inline-block text-sm text-yellow-300 hover:text-yellow-200">
              Start your first match →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {teams.map(team => {
            const teamSessions = filtered.filter(s => s.team_id === team.id);
            if (teamSessions.length === 0) return null;

            return (
              <section key={team.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{team.name}</h2>
                  <Link href={`/teams/${team.id}`} className="text-sm text-yellow-300 hover:text-yellow-200">
                    Team dashboard →
                  </Link>
                </div>
                <ul className="space-y-2">
                  {teamSessions.map(session => {
                    const href = session.ended_at
                      ? `/sessions/${session.id}/summary`
                      : `/sessions/${session.id}`;

                    return (
                      <li
                        key={session.id}
                        className="flex items-center gap-1 border border-stone-800 bg-[#111] rounded-lg transition hover:border-yellow-400"
                      >
                        <Link href={href} className="flex flex-1 items-center justify-between px-4 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {session.name ?? 'Training Session'}
                              </span>
                              {!session.ended_at && (
                                <span className="bg-yellow-400 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-black rounded">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-stone-500">
                              {new Date(session.started_at).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-stone-200">{session.total_shots} shots</p>
                            <p className="text-xs text-stone-500">{session.player_count} players</p>
                          </div>
                        </Link>
                        <div className="pr-2">
                          <DeleteSessionButton sessionId={session.id} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update sessions page to use SessionListPage**

In `src/app/sessions/page.tsx`, replace the body with:

```tsx
import Link from 'next/link';
import { getDb, getAllSessions, getAllTeams } from '@/lib/db';
import SessionListPage from '@/components/SessionListPage';

export const dynamic = 'force-dynamic';

export default function SessionsPage() {
  const db = getDb();
  const sessions = getAllSessions(db);
  const teams = getAllTeams(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-yellow-300">Match History</h1>
          <p className="text-sm text-stone-400">Every match grouped by team.</p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-yellow-400 text-black font-bold rounded-lg px-4 py-2 text-sm hover:bg-yellow-300 active:scale-[0.98] transition-all"
        >
          + New Match
        </Link>
      </div>
      <SessionListPage sessions={sessions} teams={teams} />
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchInput.tsx src/components/PlayerListPage.tsx src/components/SessionListPage.tsx src/app/players/page.tsx src/app/sessions/page.tsx
git commit -m "feat: add search and filter to players and sessions pages"
```

---

### Task 15: Add player archive (soft delete)

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `src/actions/players.ts`
- Modify: `src/components/PlayerList.tsx`

- [ ] **Step 1: Add archived_at migration to db.ts**

In `src/lib/db.ts`, in the `applySchema` function, after the existing migration blocks (around line 210, after `sessionPlayerCols` migration), add:

```tsx
const playerColsCheck = db.pragma('table_info(players)') as { name: string }[];
if (!playerColsCheck.some(col => col.name === 'archived_at')) {
  db.exec('ALTER TABLE players ADD COLUMN archived_at TEXT');
}
```

- [ ] **Step 2: Update getAllPlayers to filter archived**

In `src/lib/db.ts`, find the `getAllPlayers` function. If it exists, add a `WHERE p.archived_at IS NULL` clause. The players page uses an inline query — we need to update that too.

Add a utility function:
```tsx
export function getAllPlayersWithShots(db: Database.Database, includeArchived = false): (Player & { total_shots: number; team_name: string })[] {
  const where = includeArchived ? '' : 'WHERE p.archived_at IS NULL';
  return db.prepare(
    `SELECT
       p.*,
       t.name AS team_name,
       COALESCE(COUNT(s.id), 0) AS total_shots
     FROM players p
     JOIN teams t ON t.id = p.team_id
     LEFT JOIN shots s ON s.player_id = p.id
     ${where}
     GROUP BY p.id
     ORDER BY t.name ASC, p.name ASC`
  ).all() as (Player & { total_shots: number; team_name: string })[];
}
```

- [ ] **Step 3: Add archive/unarchive server actions**

In `src/actions/players.ts`, add:

```tsx
export async function archivePlayer(playerId: number) {
  const db = getDb();
  db.prepare("UPDATE players SET archived_at = datetime('now') WHERE id = ?").run(playerId);
  revalidatePath('/players');
}

export async function unarchivePlayer(playerId: number) {
  const db = getDb();
  db.prepare('UPDATE players SET archived_at = NULL WHERE id = ?').run(playerId);
  revalidatePath('/players');
}
```

- [ ] **Step 4: Update PlayerList.tsx with archive button**

In `src/components/PlayerList.tsx`:

Add import:
```tsx
import { archivePlayer, unarchivePlayer } from '@/actions/players';
```

Replace the Delete button in the canEdit section with an Archive button:

```tsx
<button
  onClick={() => {
    startTransition(async () => {
      try {
        await archivePlayer(player.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to archive');
      }
    });
  }}
  disabled={isPending}
  className="border border-stone-800 bg-transparent text-stone-400 rounded-lg px-3 py-2 text-sm hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-40 transition-all"
>
  Archive
</button>
```

Keep the existing Delete button but only show it for players with 0 shots (where hard delete is safe).

- [ ] **Step 5: Update players page to use the new query**

In `src/app/players/page.tsx`, replace the inline query with:

```tsx
import { getDb, getAllPlayersWithShots, getAllTeams } from '@/lib/db';

// Replace the inline db.prepare query with:
const players = getAllPlayersWithShots(db);
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db.ts src/actions/players.ts src/components/PlayerList.tsx src/app/players/page.tsx
git commit -m "feat: add player archive (soft delete) instead of hard delete"
```

---

### Task 16: Add PWA enhancements

**Files:**
- Create: `public/manifest.json`
- Create: `public/favicon.svg`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create favicon.svg**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#000"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="#fcd34d" stroke-width="2.5"/>
  <line x1="16" y1="6" x2="16" y2="26" stroke="#fcd34d" stroke-width="1.5"/>
  <line x1="6" y1="16" x2="26" y2="16" stroke="#fcd34d" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 2: Create manifest.json**

Create `public/manifest.json`:

```json
{
  "name": "Langwith Netball",
  "short_name": "ShotScore",
  "description": "Track netball shooting percentages live",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#fcd34d",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

- [ ] **Step 3: Add manifest and favicon links to layout.tsx**

In `src/app/layout.tsx`, update the metadata:

```tsx
export const metadata: Metadata = {
  title: 'Langwith Netball',
  description: 'Track Langwith Netball matches, players, and team leaderboards',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Langwith Netball',
  },
};
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/favicon.svg src/app/layout.tsx
git commit -m "feat: add PWA manifest, favicon, and apple-touch-icon"
```

---

## Final Verification

- [ ] **Full build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Manual test checklist**

Test the following in a browser:
1. Homepage loads with correct font (Inter, not Arial Black)
2. Nav shows active state on current page
3. Login page uses yellow button, not indigo
4. Admin page toggles are yellow, not indigo
5. All form inputs have consistent rounded-lg, bg-[#111] style
6. Session summary tables use stone/yellow colors, not slate/indigo
7. Deleting a session shows styled modal, not native confirm()
8. Player profile shows breadcrumb
9. Search works on players and sessions pages
10. CSV export downloads from session summary
11. Player can be archived instead of deleted
12. Favicon appears in browser tab
