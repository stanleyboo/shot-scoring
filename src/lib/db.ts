import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Player {
  id: number;
  name: string;
  created_at: string;
}

export interface Session {
  id: number;
  name: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface Shot {
  id: number;
  session_id: number;
  player_id: number;
  scored: number; // SQLite stores booleans as 0 | 1
  created_at: string;
}

export interface SessionWithStats {
  session: Session;
  players: {
    player_id: number;
    name: string;
    made: number;
    attempted: number;
  }[];
}

export interface PlayerCareerStats {
  player_id: number;
  name: string;
  total_made: number;
  total_attempted: number;
  sessions_played: number;
  sessions: {
    session_id: number;
    session_name: string | null;
    started_at: string;
    made: number;
    attempted: number;
  }[];
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS session_players (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id  INTEGER NOT NULL REFERENCES players(id),
      UNIQUE(session_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS shots (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id  INTEGER NOT NULL REFERENCES players(id),
      scored     INTEGER NOT NULL CHECK(scored IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ─── App singleton ────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath =
      process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'shots.db');
    const dir = path.dirname(dbPath);
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    applySchema(_db);
  }
  return _db;
}
