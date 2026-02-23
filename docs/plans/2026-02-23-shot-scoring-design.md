# Shot Scoring App — Design Document

**Date:** 2026-02-23
**Author:** Stan Heslington
**Status:** Approved

---

## Problem

During netball training sessions, manually tracking each player's shot attempts and calculating percentages is error-prone and interrupts the flow of practice. A purpose-built tool should make it frictionless: one tap to record a shot, live percentage visible at a glance.

---

## Target Users

Solo use — Stan, on a court, usually on a phone or tablet.

---

## MVP Features

- Create and manage a player roster
- Start a named training session with selected players
- Record each shot as "scored" or "missed" per player
- Undo last shot per player (mis-tap recovery)
- Live percentage calculation shown instantly (optimistic UI)
- End a session and view per-player summary
- Session history: list of all past sessions
- Player history: per-player stats across all sessions with trend

---

## Non-MVP (Nice-to-Have, Excluded from V1)

- Export to CSV
- Multiple concurrent active sessions
- Quarter/period tracking within a session
- Shot position tracking (left/right/centre)
- Push notifications or reminders

---

## Stack Decision

**Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + better-sqlite3**

Rationale:
- Matches the existing `habit-tracker` project on this Pi — same patterns, same mental model
- Server actions provide a clean, type-safe, no-boilerplate mutation layer
- SQLite via better-sqlite3 is zero-ops, SSD-backed, trivially backupable
- React optimistic updates make the live tap UX feel instant
- Single Docker container, minimal RAM, ARM64 compatible

---

## Architecture

### Single-container deployment

```
Next.js (Node.js container)
  └── better-sqlite3 → /data/shots.db (named Docker volume)
```

No separate API service. No auth (Tailscale provides network-level access control).

### Folder Structure

```
shot-scoring/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Landing / redirect
│   │   ├── sessions/
│   │   │   ├── new/page.tsx             # Create session
│   │   │   ├── [id]/page.tsx            # Live scoring
│   │   │   ├── [id]/summary/page.tsx    # Post-session summary
│   │   │   └── page.tsx                 # Session history
│   │   ├── players/
│   │   │   ├── page.tsx                 # Roster management
│   │   │   └── [id]/page.tsx            # Player history & stats
│   │   └── layout.tsx                   # Root layout + nav
│   ├── actions/
│   │   ├── sessions.ts                  # Session CRUD + shot recording
│   │   └── players.ts                   # Player CRUD
│   ├── lib/
│   │   └── db.ts                        # DB connection, schema, queries
│   └── components/
│       ├── PlayerScoreCard.tsx          # Per-player buttons + live stats
│       ├── SessionList.tsx              # History list
│       ├── PlayerStatsChart.tsx         # Bar chart per session
│       └── Nav.tsx                      # Navigation
├── data/                                # .gitignored, SQLite file lives here
├── docs/plans/                          # Design docs
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── PROJECT_MEMORY.md
└── package.json
```

---

## Data Model

```sql
CREATE TABLE players (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at   TEXT  -- NULL = session is active
);

CREATE TABLE session_players (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  player_id  INTEGER NOT NULL REFERENCES players(id),
  UNIQUE(session_id, player_id)
);

CREATE TABLE shots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  player_id  INTEGER NOT NULL REFERENCES players(id),
  scored     INTEGER NOT NULL CHECK(scored IN (0,1)),  -- 0=missed, 1=scored
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Percentages are always computed (`COUNT FILTER WHERE scored=1 / COUNT(*) * 100`), never stored. This keeps the data model simple and always correct.

---

## API / Server Actions

### Sessions

```ts
createSession(name: string, playerIds: number[]) → session
endSession(sessionId: number) → void
getActiveSession() → session | null
getSessionWithStats(sessionId: number) → session + per-player stats
getAllSessions() → session[]
```

### Shots

```ts
recordShot(sessionId: number, playerId: number, scored: boolean) → shot
undoLastShot(sessionId: number, playerId: number) → void
```

### Players

```ts
createPlayer(name: string) → player
deletePlayer(playerId: number) → void  // soft: keep historical shots
getAllPlayers() → player[]
getPlayerStats(playerId: number) → player + session history
```

---

## UX / UI Design

### Design Principles

- **Touch-first:** Buttons are large (minimum 56px height), spaced for thumbs
- **Optimistic:** Shot is reflected in UI immediately, persisted async
- **Low friction:** Session setup in under 10 seconds; scoring is 1 tap
- **Minimal chrome:** Hide nav during active session to maximise screen space

### Screen Designs

#### Landing (`/`)
- If active session: redirect to `/sessions/[id]`
- If no active session: centered "Start New Session" CTA + links to History and Players

#### New Session (`/sessions/new`)
- Optional session name field
- Checkbox list of all players (sorted alphabetically)
- "Start Session" disabled until ≥1 player selected

#### Live Scoring (`/sessions/[id]`)
- Header: session name + duration timer + "End Session" button
- One card per player:
  - Player name + live percentage (e.g. `73% (8/11)`) — updates optimistically
  - Two large buttons: `SCORED` (green) | `MISSED` (red)
  - Small undo button (↩) — removes last shot for that player
- On mobile: cards stack vertically, buttons full-width
- On desktop: cards in a grid

#### Session Summary (`/sessions/[id]/summary`)
- Table: Player | Made | Attempted | %
- Session totals row
- "Back to History" and "Start New Session" buttons

#### Session History (`/sessions`)
- List, newest first
- Each row: session name, date, total shots, player count
- Click → summary

#### Player Profile (`/players/[id]`)
- Player name + career stats (total sessions, career %, best session %)
- Bar chart: one bar per session showing that session's percentage
- Session table: date, made/attempted, %

#### Roster Management (`/players`)
- List of players with shot stats summary
- "Add Player" inline form (just a name field)
- Delete button (only if player has no shots, otherwise greyed out with tooltip)

---

## Docker & Deployment

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3001:3000"
    volumes:
      - shot-data:/app/data
    environment:
      - DATABASE_PATH=/app/data/shots.db
    restart: unless-stopped

volumes:
  shot-data:
```

Port `3001` to avoid conflict with the habit-tracker on `3000`.

---

## Security

- Not exposed to the public internet — access via Tailscale only
- No auth required (single-user, private network)
- SQLite file is on a named Docker volume — not accessible from outside the container
- No user input goes into raw SQL (parameterised queries via better-sqlite3)

---

## Backup / Restore

```bash
# Backup
docker cp shot-scoring-app-1:/app/data/shots.db ./shots-backup-$(date +%Y%m%d).db

# Restore
docker cp ./shots-backup-YYYYMMDD.db shot-scoring-app-1:/app/data/shots.db
docker restart shot-scoring-app-1
```

---

## Known Limitations (V1)

- No export to CSV (can be added later)
- No shot position tracking
- Single active session at a time
- Delete player is blocked if they have shots (prevents orphaned data; could be changed to soft-delete)

---

## Next Planned Steps

1. Scaffold Next.js project with TypeScript + Tailwind v4
2. Implement DB layer (`src/lib/db.ts`) with schema + queries
3. Implement server actions
4. Build live scoring UI (the core screen)
5. Build session creation + history
6. Build player roster + profile
7. Dockerise + test on Pi
8. Write README + PROJECT_MEMORY
