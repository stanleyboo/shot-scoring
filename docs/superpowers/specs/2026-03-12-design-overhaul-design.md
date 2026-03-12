# ShotScore Design Overhaul — Spec

## Summary

Full design audit and improvement of the ShotScore netball tracking app. Unifies the visual design system, improves UX polish, and adds quality-of-life features across three shippable phases.

## Context

The app was built incrementally with features added by different tools (Claude Code, OpenAI Codex). This resulted in:
- Three competing color palettes (stone/yellow on main pages, slate/indigo on admin/login, white bg on AddTeamForm)
- Inconsistent input, button, and border styles across forms
- No nav active states, buried features, no breadcrumbs
- Native browser dialogs instead of styled modals
- Missing empty states, loading feedback, and toast notifications
- No data export, search/filter, or player archiving

## Design Decisions

- **Direction**: Refined & softened — keep yellow/black identity but add consistent border-radius (8-10px), 1px borders, slightly lighter card backgrounds (#111), active nav indicators
- **Font**: Switch from "Arial Black" to Inter (Google Fonts) — clean at all sizes, good weight range, more readable for body text while keeping bold headings
- **Scoring board**: Keep current full stacked cards on mobile (no layout change) — courtside usability prioritized over compactness
- **Approach**: Phased rollout — 3 independent phases, each shippable

---

## Phase 1 — Design System & Consistency

The highest-impact phase. Makes the entire app feel like one cohesive product.

### 1.1 Design Tokens

Reference values for consistent styling. These are used directly via Tailwind utility classes (e.g., `bg-[#111]`, `border-stone-800`, `rounded-lg`) rather than CSS custom properties — the token table serves as documentation for implementers:

| Token | Value | Usage |
|---|---|---|
| `--bg-page` | `#0a0a0a` | Page background |
| `--bg-card` | `#111111` | Card/panel backgrounds |
| `--bg-input` | `#111111` | All input fields |
| `--border-default` | `#292524` (stone-800) | Card and input borders |
| `--border-accent` | `#fcd34d` (yellow-400) | Active/hover borders, nav accent |
| `--text-primary` | `#fafaf9` (stone-50) | Primary text |
| `--text-secondary` | `#a8a29e` (stone-400) | Secondary/label text |
| `--text-muted` | `#78716c` (stone-500) | Muted text |
| `--text-accent` | `#fcd34d` (yellow-400) | Accent text, highlights |
| `--text-accent-soft` | `#fde68a` (yellow-200) | Hover state for accent |
| `--color-success` | `#16a34a` (green-600) | Scored buttons |
| `--color-danger` | `#dc2626` (red-600) | Missed buttons, destructive actions |
| `--radius-sm` | `6px` | Small elements (chips, badges) |
| `--radius-md` | `8px` | Buttons, inputs |
| `--radius-lg` | `10px` | Cards, panels |

### 1.2 Font

- Add Inter via `next/font/google` (self-hosts at build time, zero layout shift, no external request)
- Font stack: `'Inter', system-ui, sans-serif`
- Weights: 400 (body), 500 (labels), 600 (semibold), 700 (bold headings), 900 (hero numbers, percentages)
- Keep uppercase tracking for small labels but reduce letter-spacing from 0.35em to 0.1em

### 1.3 Standard Input Style

All inputs and selects across the app use one pattern:

```
bg-[#111] border border-stone-800 rounded-lg px-4 py-3 text-stone-50
placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30
```

**Files to update:**
- `AddPlayerForm.tsx` — currently bg-black, border-2 border-stone-900, no rounding
- `AddTeamForm.tsx` — currently bg-white, border-black/10, rounded-xl
- `LoginForm.tsx` — currently bg-slate-800, border-slate-700, focus:indigo
- `NewSessionForm.tsx` — currently bg-black, border-2 border-stone-900, no rounding
- `AddStatTypeForm.tsx` — check and align

### 1.4 Standard Button Styles

Three button variants:

**Primary** (CTAs):
```
bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300
active:scale-[0.98] disabled:opacity-50 transition-all
```

**Danger** (destructive):
```
bg-red-600 text-white font-bold rounded-lg hover:bg-red-500
active:scale-[0.98] disabled:opacity-50 transition-all
```

**Ghost** (secondary actions):
```
border border-stone-800 bg-transparent text-stone-300 rounded-lg
hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50 transition-all
```

**Files to update:**
- `LoginForm.tsx` — currently bg-indigo-600, rounded-xl
- `AddTeamForm.tsx` — currently rounded-xl, font-semibold (should be font-bold)
- `AddStatTypeForm.tsx` — currently bg-indigo-600, rounded-xl (same issues as LoginForm)
- `LogoutButton.tsx` — check and align
- `AdminSettings.tsx` — toggle uses indigo, should use yellow
- All delete/rename buttons across the app

### 1.5 Navigation Improvements

Current nav: small text links, no active state, no mobile optimization.

Changes:
- Add active state: yellow underline (2px border-bottom) on current route
- Extract nav links into a client child component (e.g., `NavLinks.tsx`) that uses `usePathname()` for active states. Keep `Nav` as a server component so the `isAdmin()` check continues to work server-side.
- Slightly larger touch targets on mobile (py-2 instead of no padding on links)
- Keep the yellow logo badge — it's distinctive

### 1.6 Admin & Login Restyle

Bring admin and login pages into the stone/yellow palette:

**Login page:**
- Input: standard input style (see 1.3)
- Button: primary style (yellow, not indigo)
- Text colors: stone-100/stone-500 (not slate)

**Admin page:**
- Toggle switches: yellow-400 when on (not indigo-600), stone-700 when off
- Toggle container: border-stone-800 bg-[#111] (not slate-700/slate-800)
- Section headings: keep yellow-300

### 1.7 globals.css Updates

- Import Inter font
- Update body font-family
- Keep the subtle yellow gradient on left edge (nice touch)
- Remove or update any hardcoded font references

---

## Phase 2 — UX & Polish

### 2.1 Styled Confirmation Modal

Replace native `confirm()` calls with a reusable `<ConfirmModal>` component:
- Dark overlay with centered modal
- Title, message, confirm/cancel buttons
- Confirm button style matches action (danger for delete, primary for end match)
- Keyboard support (Escape to cancel, Enter to confirm)
- Used in: end session (`ScoringBoard.tsx`), delete session (`DeleteSessionButton.tsx`), delete player (`PlayerList.tsx`), delete stat type (`StatTypeList.tsx`)

### 2.2 Toast Notifications

Simple toast system for action feedback:
- Fixed position bottom-right (or bottom-center on mobile)
- Auto-dismiss after 3 seconds
- Success (green border), error (red border), info (yellow border)
- Used for: player added, team created, session ended, shot undo, stat type added
- Implementation: React context + portal, no external dependency

### 2.3 Empty States

Add helpful empty states with CTAs:

- **Dashboard (no data)**: "Welcome to Langwith Netball. Add some players and start your first match." with links to Players and New Match
- **Sessions list (empty)**: "No matches recorded yet." with Start Match CTA
- **Players list (empty)**: "No players added yet." with Add Player form visible
- **Leaderboards (empty)**: "Play some matches to see leaderboards."
- **Player profile (no sessions)**: "No match history yet."

### 2.4 Session Summary Restyle

The summary page tables currently use slate colors. Restyle to match:
- Table headers: bg-[#111] text-stone-400 uppercase tracking
- Table rows: border-stone-800, hover:bg-[#111]
- Stat values: yellow-300 for highlights

### 2.5 Breadcrumbs

Add simple breadcrumb navigation on deep pages:
- Player profile: `Players > Sarah`
- Session summary: `Matches > Training Session`
- Team dashboard: `Teams > Langwith 1s`
- Style: small text, stone-500, yellow-300 for current page

### 2.6 Club Name from Settings

The `settings` table has a `club_name` key. Use it:
- Add a `getSetting(db, key)` helper to `db.ts` for fetching individual settings
- Layout title / metadata
- Nav logo text
- Dashboard heading
- Replace all hardcoded "Langwith Netball" references

---

## Phase 3 — Quality of Life

### 3.1 CSV Export

Add export button on session summary pages:
- Server action generates CSV with columns: Player, Made, Attempted, %, plus stat type columns
- Downloads as `session-name-YYYY-MM-DD.csv`
- Also add a "Export All" on the sessions list page (all sessions as one CSV)

### 3.2 Search & Filter

**Players page:**
- Text search input at top, filters player list by name (client-side)

**Sessions page:**
- Text search by session name
- Filter by team (dropdown)

### 3.3 Player Archive

Instead of blocking deletion of players with history:
- Add `archived_at` column to players table using the existing migration-by-check pattern in `db.ts` (check column existence with `PRAGMA table_info` before `ALTER TABLE`)
- Update `getAllPlayers()` to filter `WHERE archived_at IS NULL` by default, with an optional `includeArchived` parameter for historical views
- Archived players don't appear in session creation or active roster
- Still visible in historical sessions and leaderboards
- Admin can archive/unarchive from player management

### 3.4 PWA Enhancements

- Add favicon (yellow netball icon on black)
- Add apple-touch-icon
- Add web manifest for "Add to Home Screen"
- Already has `appleWebApp` metadata — extend it

---

## Files Affected

### Phase 1 (Design System)
- `src/app/globals.css` — font import, token updates
- `src/app/layout.tsx` — Inter font via next/font
- `src/components/Nav.tsx` — keep as server component, extract links
- New: `src/components/NavLinks.tsx` — client component with `usePathname()` for active states
- `src/components/LoginForm.tsx` — restyle inputs/buttons
- `src/components/AdminSettings.tsx` — restyle toggles
- `src/components/AddPlayerForm.tsx` — standardize input style
- `src/components/AddTeamForm.tsx` — standardize input style
- `src/components/AddStatTypeForm.tsx` — standardize input style
- `src/components/NewSessionForm.tsx` — standardize input style
- `src/components/LogoutButton.tsx` — button style
- `src/components/PlayerList.tsx` — button styles
- `src/components/TeamList.tsx` — button styles
- `src/components/StatTypeList.tsx` — button styles
- `src/app/login/page.tsx` — text colors
- `src/app/admin/page.tsx` — text colors

### Phase 2 (UX & Polish)
- New: `src/components/ConfirmModal.tsx`
- New: `src/components/Toast.tsx` + `src/components/ToastProvider.tsx`
- New: `src/components/Breadcrumb.tsx`
- `src/components/ScoringBoard.tsx` — use ConfirmModal
- `src/app/sessions/[id]/summary/page.tsx` — restyle tables, add breadcrumb
- `src/app/players/[id]/page.tsx` — add breadcrumb, empty state
- `src/app/page.tsx` — empty state, use club_name
- `src/app/sessions/page.tsx` — empty state
- `src/app/players/page.tsx` — empty state
- `src/app/stats/page.tsx` — empty state
- `src/app/layout.tsx` — wrap with ToastProvider, use club_name

### Phase 3 (QoL)
- New: `src/actions/export.ts` — CSV generation
- `src/app/sessions/[id]/summary/page.tsx` — export button
- `src/app/sessions/page.tsx` — search/filter, export all
- `src/app/players/page.tsx` — search input
- `src/lib/db.ts` — add archived_at column, update queries
- `src/actions/players.ts` — archive/unarchive actions
- `public/` — favicon, icons, manifest

## Testing Strategy

- Manual testing on mobile (primary use case — courtside during matches)
- Test each phase independently before moving to next
- Verify scoring board performance isn't degraded (optimistic UI must stay snappy)
- Test admin/login flow end-to-end after restyle
- Test with 0 data (empty states), 1 item, and many items

## Out of Scope

- Shot location tracking (left/center/right court)
- Concurrent session support
- Date range filtering on leaderboards (can be added later)
- Loading skeletons (nice to have but not critical for SQLite speeds)
