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

// ─── Player queries ───────────────────────────────────────────────────────────

export function createPlayer(db: Database.Database, name: string): Player {
  return db
    .prepare('INSERT INTO players (name) VALUES (?) RETURNING *')
    .get(name) as Player;
}

export function getAllPlayers(db: Database.Database): Player[] {
  return db.prepare('SELECT * FROM players ORDER BY name ASC').all() as Player[];
}

export function getPlayerById(db: Database.Database, id: number): Player | null {
  return (
    (db.prepare('SELECT * FROM players WHERE id = ?').get(id) as Player) ?? null
  );
}

export function deletePlayer(db: Database.Database, id: number): void {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM shots WHERE player_id = ?').run(id);
    db.prepare('DELETE FROM session_players WHERE player_id = ?').run(id);
    const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);
    if (result.changes === 0) throw new Error(`Player ${id} not found`);
  });
  run();
}

export function renamePlayer(db: Database.Database, id: number, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  const result = db.prepare('UPDATE players SET name = ? WHERE id = ?').run(trimmed, id);
  if (result.changes === 0) throw new Error(`Player ${id} not found`);
}

// ─── Session queries ──────────────────────────────────────────────────────────

export function createSession(
  db: Database.Database,
  name: string | null,
  playerIds: number[]
): Session {
  const insertSession = db.prepare(
    'INSERT INTO sessions (name) VALUES (?) RETURNING *'
  );
  const insertPlayer = db.prepare(
    'INSERT INTO session_players (session_id, player_id) VALUES (?, ?)'
  );
  const run = db.transaction((name: string | null, ids: number[]) => {
    const session = insertSession.get(name) as Session;
    for (const pid of ids) insertPlayer.run(session.id, pid);
    return session;
  });
  return run(name, playerIds);
}

export function endSession(db: Database.Database, sessionId: number): void {
  const result = db
    .prepare("UPDATE sessions SET ended_at = datetime('now') WHERE id = ?")
    .run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function getActiveSession(db: Database.Database): Session | null {
  return (
    (db
      .prepare(
        'SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC, id DESC LIMIT 1'
      )
      .get() as Session) ?? null
  );
}

export function getAllSessions(
  db: Database.Database
): (Session & { player_count: number; total_shots: number })[] {
  return db
    .prepare(
      `SELECT s.*,
         COUNT(DISTINCT sp.player_id) AS player_count,
         COUNT(sh.id)                 AS total_shots
       FROM sessions s
       LEFT JOIN session_players sp ON sp.session_id = s.id
       LEFT JOIN shots sh            ON sh.session_id = s.id
       GROUP BY s.id
       ORDER BY s.started_at DESC, s.id DESC`
    )
    .all() as (Session & { player_count: number; total_shots: number })[];
}

export function getSessionWithStats(
  db: Database.Database,
  sessionId: number
): SessionWithStats | null {
  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(sessionId) as Session | undefined;
  if (!session) return null;

  const players = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
         COALESCE(COUNT(sh.id), 0)                                    AS attempted
       FROM session_players sp
       JOIN players p ON p.id = sp.player_id
       LEFT JOIN shots sh ON sh.player_id = p.id AND sh.session_id = ?
       WHERE sp.session_id = ?
       GROUP BY p.id
       ORDER BY p.name ASC`
    )
    .all(sessionId, sessionId) as SessionWithStats['players'];

  return { session, players };
}

export function deleteSession(db: Database.Database, sessionId: number): void {
  // ON DELETE CASCADE handles shots and session_players automatically
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function renameSession(
  db: Database.Database,
  sessionId: number,
  name: string | null
): void {
  const result = db
    .prepare('UPDATE sessions SET name = ? WHERE id = ?')
    .run(name, sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

// ─── Shot queries ─────────────────────────────────────────────────────────────

export function recordShot(
  db: Database.Database,
  sessionId: number,
  playerId: number,
  scored: boolean
): Shot {
  return db
    .prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, ?) RETURNING *'
    )
    .get(sessionId, playerId, scored ? 1 : 0) as Shot;
}

export function undoLastShot(
  db: Database.Database,
  sessionId: number,
  playerId: number
): void {
  const last = db
    .prepare(
      `SELECT id FROM shots
       WHERE session_id = ? AND player_id = ?
       ORDER BY created_at DESC, id DESC LIMIT 1`
    )
    .get(sessionId, playerId) as { id: number } | undefined;
  if (last) {
    db.prepare('DELETE FROM shots WHERE id = ?').run(last.id);
  }
}

export function getPlayerCareerStats(
  db: Database.Database,
  playerId: number
): PlayerCareerStats {
  const player = getPlayerById(db, playerId);
  if (!player) throw new Error(`Player ${playerId} not found`);

  const agg = db
    .prepare(
      `SELECT
         COUNT(DISTINCT sh.session_id)                                    AS sessions_played,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0)     AS total_made,
         COALESCE(COUNT(sh.id), 0)                                        AS total_attempted
       FROM shots sh
       WHERE sh.player_id = ?`
    )
    .get(playerId) as {
    sessions_played: number;
    total_made: number;
    total_attempted: number;
  };

  const sessions = db
    .prepare(
      `SELECT
         s.id   AS session_id,
         s.name AS session_name,
         s.started_at,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
         COALESCE(COUNT(sh.id), 0)                                    AS attempted
       FROM session_players sp
       JOIN sessions s ON s.id = sp.session_id
       LEFT JOIN shots sh ON sh.session_id = s.id AND sh.player_id = ?
       WHERE sp.player_id = ?
       GROUP BY s.id
       ORDER BY s.started_at DESC`
    )
    .all(playerId, playerId) as PlayerCareerStats['sessions'];

  return {
    player_id: playerId,
    name: player.name,
    ...agg,
    sessions,
  };
}
