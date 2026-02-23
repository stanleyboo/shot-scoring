# ShotScore Project Memory

## Overview

ShotScore tracks netball shooting performance across sessions. Players, sessions, and individual shot outcomes are stored in SQLite.

## Stack Decisions

- Framework: Next.js App Router for server actions and route structure
- Database: better-sqlite3 for local, fast, low-ops persistence
- Styling: Tailwind CSS
- Testing: Jest for database query coverage
- Deployment: Docker with standalone Next.js output

## Architecture

- Single Next.js container
- Database access through `getDb()` singleton in `src/lib/db.ts`
- Server actions in `src/actions/` for writes and cache revalidation
- Live scoring UI in `src/components/ScoringBoard.tsx`

## Data Model

- `players`: id, name, created_at
- `sessions`: id, name, started_at, ended_at
- `session_players`: id, session_id, player_id
- `shots`: id, session_id, player_id, scored, created_at

Percentages are calculated from shot records and not stored.

## Key Files

- `src/lib/db.ts`: schema + query layer
- `src/lib/db.test.ts`: query tests
- `src/actions/players.ts`: player mutations
- `src/actions/sessions.ts`: session mutations
- `src/actions/shots.ts`: shot record/undo
- `src/app/sessions/[id]/page.tsx`: live session scoring
- `src/components/PlayerScoreCard.tsx`: per-player scoring controls
- `docker-compose.yml`: runtime config and volume mount

## Deployment Notes

- Host port: `3001`
- Database path in container: `/app/data/shots.db`
- Named volume: `shot-scoring-data`
- `next.config.ts` uses `output: 'standalone'`

## Known Limitations

- Single active session workflow
- No CSV export
- No shot location tracking
- Player delete blocked when history exists

## Next Steps

- CSV export for sessions
- Shot location metadata (left/center/right)
- Concurrent session support
