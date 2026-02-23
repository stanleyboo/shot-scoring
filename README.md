# ShotScore

Netball shooting percentage tracker. Track shot attempts live during training by tapping scored or missed per player, and watch percentages update instantly.

## Stack

- Framework: Next.js 16 (App Router) + TypeScript
- Styling: Tailwind CSS v4
- Database: SQLite via better-sqlite3
- Deployment: Docker + Docker Compose (ARM64 / Raspberry Pi)
- Access: Private network access

## Local Development

```bash
npm install
npm run dev
# http://localhost:3000
```

## Test and Build

```bash
npm test
npm run build
```

## Deploy with Docker

```bash
docker compose up -d --build
```

App is exposed on port `3001`.

## Backup and Restore

```bash
# Backup
docker cp $(docker compose ps -q app):/app/data/shots.db ./shots-backup-$(date +%Y%m%d).db

# Restore
docker cp ./shots-backup-YYYYMMDD.db $(docker compose ps -q app):/app/data/shots.db
docker compose restart app
```

## Data

All data is stored in `shots.db` in the `shot-scoring-data` Docker volume and mounted at `/app/data/shots.db`.

## Routes

- `/`: landing page / redirect to active session
- `/sessions/new`: start a session
- `/sessions/[id]`: live scoring
- `/sessions/[id]/summary`: session summary
- `/sessions`: session history
- `/players`: player roster
- `/players/[id]`: player profile and stats
