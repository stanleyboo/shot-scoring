import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DEFAULT_CLUB_NAME = 'Langwith Netball';
const DEFAULT_TEAM_NAME = 'Langwith Netball';

export interface Team {
  id: number;
  name: string;
  created_at: string;
}

export interface Player {
  id: number;
  team_id: number;
  team_name?: string;
  name: string;
  created_at: string;
}

export interface Session {
  id: number;
  team_id: number;
  team_name?: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  opposition_score: number;
  opposition_attempted: number;
  current_quarter: number;
}

export interface Shot {
  id: number;
  session_id: number;
  player_id: number;
  scored: number;
  created_at: string;
}

export interface StatType {
  id: number;
  name: string;
  enabled: number;
  created_at: string;
}

export const NETBALL_POSITIONS = ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'] as const;
export type Position = typeof NETBALL_POSITIONS[number];

export interface SessionWithStats {
  session: Session;
  players: {
    player_id: number;
    name: string;
    made: number;
    attempted: number;
    is_opposition: boolean;
    position: string | null;
    quarters_played: number[];
    stat_counts: Record<number, number>;
  }[];
}

export interface PlayerCareerStats {
  player_id: number;
  name: string;
  team_id: number;
  team_name: string;
  total_made: number;
  total_attempted: number;
  sessions_played: number;
  career_stat_counts: Record<number, number>;
  sessions: {
    session_id: number;
    session_name: string | null;
    started_at: string;
    team_id: number;
    team_name: string;
    made: number;
    attempted: number;
    stat_counts: Record<number, number>;
  }[];
}

export interface TeamSummary {
  id: number;
  name: string;
  player_count: number;
  session_count: number;
  total_goals: number;
  total_attempts: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface LeaderboardEntry {
  player_id: number;
  name: string;
  value: number;
  label?: string;
}

export interface Leaderboard {
  title: string;
  subtitle: string;
  format?: 'number' | 'percent';
  entries: LeaderboardEntry[];
}

function getDefaultTeamId(db: Database.Database): number {
  const team = db
    .prepare('SELECT id FROM teams WHERE name = ?')
    .get(DEFAULT_TEAM_NAME) as { id: number } | undefined;

  if (team) return team.id;

  return (
    db
      .prepare('INSERT INTO teams (name) VALUES (?) RETURNING id')
      .get(DEFAULT_TEAM_NAME) as { id: number }
  ).id;
}

export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS stat_types (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stat_events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id    INTEGER NOT NULL REFERENCES players(id),
      stat_type_id INTEGER NOT NULL REFERENCES stat_types(id) ON DELETE CASCADE,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token      TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      message    TEXT NOT NULL,
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('public_can_create', '1')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('public_can_edit', '1')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('club_name', ?)").run(DEFAULT_CLUB_NAME);

  db.prepare('INSERT OR IGNORE INTO teams (name) VALUES (?)').run(DEFAULT_TEAM_NAME);
  const defaultTeamId = getDefaultTeamId(db);

  const sessionCols = db.pragma('table_info(sessions)') as { name: string }[];
  if (!sessionCols.some(col => col.name === 'opposition_score')) {
    db.exec('ALTER TABLE sessions ADD COLUMN opposition_score INTEGER NOT NULL DEFAULT 0');
  }
  if (!sessionCols.some(col => col.name === 'opposition_attempted')) {
    db.exec('ALTER TABLE sessions ADD COLUMN opposition_attempted INTEGER NOT NULL DEFAULT 0');
  }
  if (!sessionCols.some(col => col.name === 'team_id')) {
    db.exec('ALTER TABLE sessions ADD COLUMN team_id INTEGER REFERENCES teams(id)');
  }

  const playerCols = db.pragma('table_info(players)') as { name: string }[];
  if (!playerCols.some(col => col.name === 'team_id')) {
    db.exec('ALTER TABLE players ADD COLUMN team_id INTEGER REFERENCES teams(id)');
  }

  const sessionPlayerCols = db.pragma('table_info(session_players)') as { name: string }[];
  if (!sessionPlayerCols.some(col => col.name === 'is_opposition')) {
    db.exec('ALTER TABLE session_players ADD COLUMN is_opposition INTEGER NOT NULL DEFAULT 0');
  }

  const playerColsCheck = db.pragma('table_info(players)') as { name: string }[];
  if (!playerColsCheck.some(col => col.name === 'archived_at')) {
    db.exec('ALTER TABLE players ADD COLUMN archived_at TEXT');
  }

  const shotColsCheck = db.pragma('table_info(shots)') as { name: string }[];
  if (!shotColsCheck.some(col => col.name === 'quarter')) {
    db.exec('ALTER TABLE shots ADD COLUMN quarter INTEGER NOT NULL DEFAULT 1');
  }

  const statEventColsCheck = db.pragma('table_info(stat_events)') as { name: string }[];
  if (!statEventColsCheck.some(col => col.name === 'quarter')) {
    db.exec('ALTER TABLE stat_events ADD COLUMN quarter INTEGER NOT NULL DEFAULT 1');
  }

  // Soft-delete columns
  const sessionColsCheck2 = db.pragma('table_info(sessions)') as { name: string }[];
  if (!sessionColsCheck2.some(col => col.name === 'deleted_at')) {
    db.exec('ALTER TABLE sessions ADD COLUMN deleted_at TEXT');
  }
  if (!sessionColsCheck2.some(col => col.name === 'current_quarter')) {
    db.exec('ALTER TABLE sessions ADD COLUMN current_quarter INTEGER NOT NULL DEFAULT 1');
  }

  const playerColsCheck2 = db.pragma('table_info(players)') as { name: string }[];
  if (!playerColsCheck2.some(col => col.name === 'deleted_at')) {
    db.exec('ALTER TABLE players ADD COLUMN deleted_at TEXT');
  }

  const teamColsCheck = db.pragma('table_info(teams)') as { name: string }[];
  if (!teamColsCheck.some(col => col.name === 'deleted_at')) {
    db.exec('ALTER TABLE teams ADD COLUMN deleted_at TEXT');
  }

  const statTypeCols = db.pragma('table_info(stat_types)') as { name: string }[];
  if (!statTypeCols.some(col => col.name === 'enabled')) {
    db.exec('ALTER TABLE stat_types ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
  }

  // Position column on session_players
  const spCols2 = db.pragma('table_info(session_players)') as { name: string }[];
  if (!spCols2.some(col => col.name === 'position')) {
    db.exec('ALTER TABLE session_players ADD COLUMN position TEXT');
  }

  // Player quarters participation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS player_quarters (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id  INTEGER NOT NULL REFERENCES players(id),
      quarter    INTEGER NOT NULL,
      UNIQUE(session_id, player_id, quarter)
    );
    CREATE INDEX IF NOT EXISTS idx_player_quarters_session ON player_quarters(session_id);
  `);

  db.prepare('UPDATE players SET team_id = ? WHERE team_id IS NULL').run(defaultTeamId);
  db.prepare('UPDATE sessions SET team_id = ? WHERE team_id IS NULL').run(defaultTeamId);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_team_id ON sessions(team_id);
    CREATE INDEX IF NOT EXISTS idx_shots_session_player ON shots(session_id, player_id);
    CREATE INDEX IF NOT EXISTS idx_stat_events_session_player ON stat_events(session_id, player_id);
  `);

  // Messages table (social/chat)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      author     TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Announcements table (updates, fixtures, training)
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      content    TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'update',
      event_date TEXT,
      event_time TEXT,
      location   TEXT,
      opponent   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate: add new columns if missing
  const annCols = db.pragma('table_info(announcements)') as { name: string }[];
  if (!annCols.some(c => c.name === 'event_time')) db.exec('ALTER TABLE announcements ADD COLUMN event_time TEXT');
  if (!annCols.some(c => c.name === 'location')) db.exec('ALTER TABLE announcements ADD COLUMN location TEXT');
  if (!annCols.some(c => c.name === 'opponent')) db.exec('ALTER TABLE announcements ADD COLUMN opponent TEXT');

  // Page visibility settings (all/admin/off)
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_matches', 'all')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_players', 'all')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_teams', 'all')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_stats', 'all')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_feedback', 'all')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_social', 'off')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('page_updates', 'off')").run();
  // Migrate old feature flags
  const oldSocial = db.prepare("SELECT value FROM settings WHERE key = 'feature_social'").get() as { value: string } | undefined;
  if (oldSocial) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('page_social', ?)").run(oldSocial.value === '1' ? 'all' : 'off');
    db.prepare("DELETE FROM settings WHERE key = 'feature_social'").run();
  }
  const oldUpdates = db.prepare("SELECT value FROM settings WHERE key = 'feature_updates'").get() as { value: string } | undefined;
  if (oldUpdates) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('page_updates', ?)").run(oldUpdates.value === '1' ? 'all' : 'off');
    db.prepare("DELETE FROM settings WHERE key = 'feature_updates'").run();
  }

  const seedTypes = ['Interceptions', 'Assists', 'Turnovers', 'Feeds'];
  const insertType = db.prepare('INSERT OR IGNORE INTO stat_types (name) VALUES (?)');
  for (const name of seedTypes) insertType.run(name);
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'shots.db');
  const dir = path.dirname(dbPath);

  if (dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  applySchema(_db);
  return _db;
}

export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function createTeam(db: Database.Database, name: string): Team {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name cannot be empty');
  return db.prepare('INSERT INTO teams (name) VALUES (?) RETURNING *').get(trimmed) as Team;
}

export function deleteTeam(db: Database.Database, teamId: number): void {
  const playerCount = (db.prepare('SELECT COUNT(*) AS cnt FROM players WHERE team_id = ?').get(teamId) as { cnt: number }).cnt;
  if (playerCount > 0) throw new Error('Cannot delete a team that has players. Move or archive them first.');
  const sessionCount = (db.prepare('SELECT COUNT(*) AS cnt FROM sessions WHERE team_id = ?').get(teamId) as { cnt: number }).cnt;
  if (sessionCount > 0) throw new Error('Cannot delete a team that has match history.');
  const result = db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  if (result.changes === 0) throw new Error(`Team ${teamId} not found`);
}

export function renameTeam(db: Database.Database, teamId: number, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name cannot be empty');
  const result = db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(trimmed, teamId);
  if (result.changes === 0) throw new Error(`Team ${teamId} not found`);
}

export function getAllTeams(db: Database.Database): Team[] {
  return db.prepare('SELECT * FROM teams WHERE deleted_at IS NULL ORDER BY name ASC').all() as Team[];
}

export function getTeamById(db: Database.Database, teamId: number): Team | null {
  return (
    (db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as Team | undefined) ?? null
  );
}

export function getTeamSummaries(db: Database.Database): TeamSummary[] {
  const teams = getAllTeams(db);

  return teams.map(team => {
    const base = db.prepare(
      `SELECT
         (SELECT COUNT(*) FROM players WHERE team_id = @teamId) AS player_count,
         (SELECT COUNT(*) FROM sessions WHERE team_id = @teamId AND ended_at IS NOT NULL AND deleted_at IS NULL) AS session_count,
         COALESCE((
           SELECT SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END)
           FROM shots sh
           JOIN sessions s ON s.id = sh.session_id
           JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
           WHERE s.team_id = @teamId AND sp.is_opposition = 0 AND s.deleted_at IS NULL
         ), 0) AS total_goals,
         COALESCE((
           SELECT COUNT(*)
           FROM shots sh
           JOIN sessions s ON s.id = sh.session_id
           JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
           WHERE s.team_id = @teamId AND sp.is_opposition = 0 AND s.deleted_at IS NULL
         ), 0) AS total_attempts`
    ).get({ teamId: team.id }) as {
      player_count: number;
      session_count: number;
      total_goals: number;
      total_attempts: number;
    };

    const results = getMatchResults(db, team.id);
    return {
      id: team.id,
      name: team.name,
      ...base,
      wins: results.filter(result => result.home > result.opp).length,
      draws: results.filter(result => result.home === result.opp).length,
      losses: results.filter(result => result.home < result.opp).length,
    };
  });
}

export function createPlayer(db: Database.Database, name: string, teamId: number): Player {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  return db
    .prepare('INSERT INTO players (name, team_id) VALUES (?, ?) RETURNING *')
    .get(trimmed, teamId) as Player;
}

export function getAllPlayers(db: Database.Database, teamId?: number, includeArchived = false): Player[] {
  const conditions: string[] = ['p.deleted_at IS NULL'];
  if (!includeArchived) conditions.push('p.archived_at IS NULL');
  if (teamId) conditions.push('p.team_id = @teamId');
  const where = `WHERE ${conditions.join(' AND ')}`;
  return db
    .prepare(
      `SELECT p.*, t.name AS team_name
       FROM players p
       JOIN teams t ON t.id = p.team_id
       ${where}
       ORDER BY t.name ASC, p.name ASC`
    )
    .all(teamId ? { teamId } : {}) as Player[];
}

export function getAllPlayersWithShots(db: Database.Database, includeArchived = false): (Player & { total_shots: number; team_name: string })[] {
  const where = includeArchived ? 'WHERE p.deleted_at IS NULL' : 'WHERE p.archived_at IS NULL AND p.deleted_at IS NULL';
  return db.prepare(
    `SELECT
       p.*,
       t.name AS team_name,
       COALESCE(COUNT(s.id), 0) AS total_shots
     FROM players p
     JOIN teams t ON t.id = p.team_id
     LEFT JOIN shots s ON s.player_id = p.id AND s.session_id IN (SELECT id FROM sessions WHERE deleted_at IS NULL)
     ${where}
     GROUP BY p.id
     ORDER BY t.name ASC, p.name ASC`
  ).all() as (Player & { total_shots: number; team_name: string })[];
}

export function getPlayerById(db: Database.Database, id: number): Player | null {
  return (
    (db
      .prepare(
        `SELECT p.*, t.name AS team_name
         FROM players p
         JOIN teams t ON t.id = p.team_id
         WHERE p.id = ?`
      )
      .get(id) as Player | undefined) ?? null
  );
}

export function deletePlayer(db: Database.Database, id: number): void {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM shots WHERE player_id = ?').run(id);
    db.prepare('DELETE FROM stat_events WHERE player_id = ?').run(id);
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

export function updatePlayerTeam(db: Database.Database, id: number, teamId: number): void {
  const result = db.prepare('UPDATE players SET team_id = ? WHERE id = ?').run(teamId, id);
  if (result.changes === 0) throw new Error(`Player ${id} not found`);
}

export function createSession(
  db: Database.Database,
  name: string | null,
  playerIds: number[],
  teamId: number
): Session {
  if (playerIds.length === 0) throw new Error('Select at least one player');

  const players = db
    .prepare(
      `SELECT id FROM players
       WHERE team_id = ? AND id IN (${playerIds.map(() => '?').join(', ')})`
    )
    .all(teamId, ...playerIds) as { id: number }[];

  if (players.length !== playerIds.length) {
    throw new Error('Selected players must belong to the chosen team');
  }

  const insertSession = db.prepare(
    'INSERT INTO sessions (name, team_id) VALUES (?, ?) RETURNING *'
  );
  const insertPlayer = db.prepare(
    'INSERT INTO session_players (session_id, player_id) VALUES (?, ?)'
  );

  const run = db.transaction((sessionName: string | null, ids: number[], selectedTeamId: number) => {
    const session = insertSession.get(sessionName, selectedTeamId) as Session;
    for (const playerId of ids) insertPlayer.run(session.id, playerId);
    return getSessionById(db, session.id)!;
  });

  return run(name, playerIds, teamId);
}

export function endSession(db: Database.Database, sessionId: number): void {
  const result = db.prepare("UPDATE sessions SET ended_at = datetime('now') WHERE id = ?").run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function getSessionById(db: Database.Database, sessionId: number): Session | null {
  return (
    (db
      .prepare(
        `SELECT s.*, t.name AS team_name
         FROM sessions s
         JOIN teams t ON t.id = s.team_id
         WHERE s.id = ?`
      )
      .get(sessionId) as Session | undefined) ?? null
  );
}

export function getActiveSession(db: Database.Database): Session | null {
  return (
    (db
      .prepare(
        `SELECT s.*, t.name AS team_name
         FROM sessions s
         JOIN teams t ON t.id = s.team_id
         WHERE s.ended_at IS NULL AND s.deleted_at IS NULL
         ORDER BY s.started_at DESC, s.id DESC
         LIMIT 1`
      )
      .get() as Session | undefined) ?? null
  );
}

export function getAllSessions(
  db: Database.Database,
  teamId?: number
): (Session & { player_count: number; total_shots: number; home_score: number; opp_score: number })[] {
  return db
    .prepare(
      `SELECT
         s.*,
         t.name AS team_name,
         COUNT(DISTINCT CASE WHEN sp.is_opposition = 0 THEN sp.player_id END) AS player_count,
         COUNT(sh.id) AS total_shots,
         COALESCE(SUM(CASE WHEN sp.is_opposition = 0 AND sh.scored = 1 THEN 1 ELSE 0 END), 0) AS home_score,
         s.opposition_score + COALESCE(SUM(CASE WHEN sp.is_opposition = 1 AND sh.scored = 1 THEN 1 ELSE 0 END), 0) AS opp_score
       FROM sessions s
       JOIN teams t ON t.id = s.team_id
       LEFT JOIN session_players sp ON sp.session_id = s.id
       LEFT JOIN shots sh ON sh.session_id = s.id AND sh.player_id = sp.player_id
       WHERE s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY s.id
       ORDER BY s.started_at DESC, s.id DESC`
    )
    .all(teamId ? { teamId } : {}) as (Session & { player_count: number; total_shots: number; home_score: number; opp_score: number })[];
}

export function getSessionWithStats(db: Database.Database, sessionId: number): SessionWithStats | null {
  const session = getSessionById(db, sessionId);
  if (!session) return null;

  const shotRows = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         sp.is_opposition,
         sp.position,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
         COALESCE(COUNT(sh.id), 0) AS attempted
       FROM session_players sp
       JOIN players p ON p.id = sp.player_id
       LEFT JOIN shots sh ON sh.player_id = p.id AND sh.session_id = ?
       WHERE sp.session_id = ?
       GROUP BY p.id, p.name, sp.is_opposition, sp.position
       ORDER BY sp.is_opposition ASC, p.name ASC`
    )
    .all(sessionId, sessionId) as {
    player_id: number;
    name: string;
    is_opposition: number;
    position: string | null;
    made: number;
    attempted: number;
  }[];

  const quarterRows = db
    .prepare('SELECT player_id, quarter FROM player_quarters WHERE session_id = ? ORDER BY quarter')
    .all(sessionId) as { player_id: number; quarter: number }[];

  const quarterMap = new Map<number, number[]>();
  for (const row of quarterRows) {
    const arr = quarterMap.get(row.player_id) ?? [];
    arr.push(row.quarter);
    quarterMap.set(row.player_id, arr);
  }

  const statRows = db
    .prepare(
      `SELECT player_id, stat_type_id, COUNT(*) AS cnt
       FROM stat_events
       WHERE session_id = ?
       GROUP BY player_id, stat_type_id`
    )
    .all(sessionId) as { player_id: number; stat_type_id: number; cnt: number }[];

  const statMap = new Map<number, Record<number, number>>();
  for (const row of statRows) {
    const playerStats = statMap.get(row.player_id) ?? {};
    playerStats[row.stat_type_id] = row.cnt;
    statMap.set(row.player_id, playerStats);
  }

  return {
    session,
    players: shotRows.map(player => ({
      player_id: player.player_id,
      name: player.name,
      made: player.made,
      attempted: player.attempted,
      is_opposition: player.is_opposition === 1,
      position: player.position,
      quarters_played: quarterMap.get(player.player_id) ?? [],
      stat_counts: statMap.get(player.player_id) ?? {},
    })),
  };
}

export function setSessionQuarter(db: Database.Database, sessionId: number, quarter: number): void {
  db.prepare('UPDATE sessions SET current_quarter = ? WHERE id = ?').run(quarter, sessionId);
}

export function reopenSession(db: Database.Database, sessionId: number): void {
  const result = db.prepare('UPDATE sessions SET ended_at = NULL WHERE id = ?').run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function deleteSession(db: Database.Database, sessionId: number): void {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function renameSession(db: Database.Database, sessionId: number, name: string | null): void {
  const result = db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function updateSessionTeam(db: Database.Database, sessionId: number, teamId: number): void {
  const result = db.prepare('UPDATE sessions SET team_id = ? WHERE id = ?').run(teamId, sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function addPlayerToSession(db: Database.Database, sessionId: number, playerId: number): void {
  const existing = db.prepare('SELECT 1 FROM session_players WHERE session_id = ? AND player_id = ?').get(sessionId, playerId);
  if (existing) throw new Error('Player already in this session');
  db.prepare('INSERT INTO session_players (session_id, player_id) VALUES (?, ?)').run(sessionId, playerId);
}

export function removePlayerFromSession(db: Database.Database, sessionId: number, playerId: number): void {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM shots WHERE session_id = ? AND player_id = ?').run(sessionId, playerId);
    db.prepare('DELETE FROM stat_events WHERE session_id = ? AND player_id = ?').run(sessionId, playerId);
    const result = db.prepare('DELETE FROM session_players WHERE session_id = ? AND player_id = ?').run(sessionId, playerId);
    if (result.changes === 0) throw new Error('Player not in this session');
  });
  run();
}

export interface QuarterBreakdown {
  quarter: number;
  home_made: number;
  home_attempted: number;
  opp_made: number;
  opp_attempted: number;
  stat_counts: Record<number, number>;
}

export function getSessionQuarterBreakdown(db: Database.Database, sessionId: number): QuarterBreakdown[] {
  const shotRows = db.prepare(
    `SELECT
       sh.quarter,
       COALESCE(SUM(CASE WHEN sp.is_opposition = 0 AND sh.scored = 1 THEN 1 ELSE 0 END), 0) AS home_made,
       COALESCE(SUM(CASE WHEN sp.is_opposition = 0 THEN 1 ELSE 0 END), 0) AS home_attempted,
       COALESCE(SUM(CASE WHEN sp.is_opposition = 1 AND sh.scored = 1 THEN 1 ELSE 0 END), 0) AS opp_made,
       COALESCE(SUM(CASE WHEN sp.is_opposition = 1 THEN 1 ELSE 0 END), 0) AS opp_attempted
     FROM shots sh
     JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
     WHERE sh.session_id = ?
     GROUP BY sh.quarter
     ORDER BY sh.quarter`
  ).all(sessionId) as { quarter: number; home_made: number; home_attempted: number; opp_made: number; opp_attempted: number }[];

  const statRows = db.prepare(
    `SELECT se.quarter, se.stat_type_id, COUNT(*) AS cnt
     FROM stat_events se
     JOIN stat_types st ON st.id = se.stat_type_id AND st.enabled = 1
     WHERE se.session_id = ?
     GROUP BY se.quarter, se.stat_type_id`
  ).all(sessionId) as { quarter: number; stat_type_id: number; cnt: number }[];

  const statMap = new Map<number, Record<number, number>>();
  for (const row of statRows) {
    const qStats = statMap.get(row.quarter) ?? {};
    qStats[row.stat_type_id] = row.cnt;
    statMap.set(row.quarter, qStats);
  }

  return shotRows.map(row => ({
    ...row,
    stat_counts: statMap.get(row.quarter) ?? {},
  }));
}

export interface PlayerQuarterStats {
  player_id: number;
  name: string;
  quarter: number;
  made: number;
  attempted: number;
  stat_counts: Record<number, number>;
}

export function getPlayerQuarterBreakdown(db: Database.Database, sessionId: number): PlayerQuarterStats[] {
  // Build a complete grid: every home player × every quarter they were on court OR had shots/stats in
  // 1. Get all quarters from player_quarters, shots, and stat_events
  const courtQuarters = db.prepare(
    `SELECT DISTINCT pq.player_id, pq.quarter
     FROM player_quarters pq
     JOIN session_players sp ON sp.session_id = pq.session_id AND sp.player_id = pq.player_id
     WHERE pq.session_id = ? AND sp.is_opposition = 0`
  ).all(sessionId) as { player_id: number; quarter: number }[];

  const shotQuarters = db.prepare(
    `SELECT DISTINCT sh.player_id, sh.quarter
     FROM shots sh
     JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
     WHERE sh.session_id = ? AND sp.is_opposition = 0`
  ).all(sessionId) as { player_id: number; quarter: number }[];

  const statQuarters = db.prepare(
    `SELECT DISTINCT se.player_id, se.quarter
     FROM stat_events se
     JOIN session_players sp ON sp.session_id = se.session_id AND sp.player_id = se.player_id
     WHERE se.session_id = ? AND sp.is_opposition = 0`
  ).all(sessionId) as { player_id: number; quarter: number }[];

  // Merge all player-quarter combos
  const pqSet = new Set<string>();
  for (const r of [...courtQuarters, ...shotQuarters, ...statQuarters]) {
    pqSet.add(`${r.player_id}-${r.quarter}`);
  }

  if (pqSet.size === 0) return [];

  // 2. Get player names
  const playerNames = new Map<number, string>();
  const nameRows = db.prepare(
    `SELECT sp.player_id, p.name
     FROM session_players sp
     JOIN players p ON p.id = sp.player_id
     WHERE sp.session_id = ? AND sp.is_opposition = 0`
  ).all(sessionId) as { player_id: number; name: string }[];
  for (const r of nameRows) playerNames.set(r.player_id, r.name);

  // 3. Get shot data
  const shotRows = db.prepare(
    `SELECT sh.player_id, sh.quarter,
       COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
       COUNT(sh.id) AS attempted
     FROM shots sh
     JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
     WHERE sh.session_id = ? AND sp.is_opposition = 0
     GROUP BY sh.player_id, sh.quarter`
  ).all(sessionId) as { player_id: number; quarter: number; made: number; attempted: number }[];
  const shotMap = new Map<string, { made: number; attempted: number }>();
  for (const r of shotRows) shotMap.set(`${r.player_id}-${r.quarter}`, { made: r.made, attempted: r.attempted });

  // 4. Get stat data
  const statRows = db.prepare(
    `SELECT se.player_id, se.quarter, se.stat_type_id, COUNT(*) AS cnt
     FROM stat_events se
     JOIN session_players sp ON sp.session_id = se.session_id AND sp.player_id = se.player_id
     JOIN stat_types st ON st.id = se.stat_type_id AND st.enabled = 1
     WHERE se.session_id = ? AND sp.is_opposition = 0
     GROUP BY se.player_id, se.quarter, se.stat_type_id`
  ).all(sessionId) as { player_id: number; quarter: number; stat_type_id: number; cnt: number }[];
  const statMap = new Map<string, Record<number, number>>();
  for (const row of statRows) {
    const key = `${row.player_id}-${row.quarter}`;
    const entry = statMap.get(key) ?? {};
    entry[row.stat_type_id] = row.cnt;
    statMap.set(key, entry);
  }

  // 5. Build result for every player-quarter combo
  const results: PlayerQuarterStats[] = [];
  for (const pqKey of pqSet) {
    const [pidStr, qStr] = pqKey.split('-');
    const player_id = parseInt(pidStr, 10);
    const quarter = parseInt(qStr, 10);
    const shots = shotMap.get(pqKey) ?? { made: 0, attempted: 0 };
    results.push({
      player_id,
      name: playerNames.get(player_id) ?? '',
      quarter,
      made: shots.made,
      attempted: shots.attempted,
      stat_counts: statMap.get(pqKey) ?? {},
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name) || a.quarter - b.quarter);
  return results;
}

export function setPlayerPosition(db: Database.Database, sessionId: number, playerId: number, position: string | null): void {
  db.prepare(
    'UPDATE session_players SET position = ? WHERE session_id = ? AND player_id = ?'
  ).run(position, sessionId, playerId);
}

export function setPlayerQuarters(db: Database.Database, sessionId: number, playerId: number, quarters: number[]): void {
  const run = db.transaction(() => {
    db.prepare('DELETE FROM player_quarters WHERE session_id = ? AND player_id = ?').run(sessionId, playerId);
    const insert = db.prepare('INSERT INTO player_quarters (session_id, player_id, quarter) VALUES (?, ?, ?)');
    for (const q of quarters) insert.run(sessionId, playerId, q);
  });
  run();
}

export function togglePlayerQuarter(db: Database.Database, sessionId: number, playerId: number, quarter: number): boolean {
  const existing = db.prepare(
    'SELECT id FROM player_quarters WHERE session_id = ? AND player_id = ? AND quarter = ?'
  ).get(sessionId, playerId, quarter) as { id: number } | undefined;

  if (existing) {
    db.prepare('DELETE FROM player_quarters WHERE id = ?').run(existing.id);
    return false; // removed
  } else {
    db.prepare('INSERT INTO player_quarters (session_id, player_id, quarter) VALUES (?, ?, ?)').run(sessionId, playerId, quarter);
    return true; // added
  }
}

export function getPlayerQuartersPlayed(db: Database.Database, sessionId: number): Map<number, number[]> {
  const rows = db.prepare(
    'SELECT player_id, quarter FROM player_quarters WHERE session_id = ? ORDER BY quarter'
  ).all(sessionId) as { player_id: number; quarter: number }[];

  const map = new Map<number, number[]>();
  for (const row of rows) {
    const arr = map.get(row.player_id) ?? [];
    arr.push(row.quarter);
    map.set(row.player_id, arr);
  }
  return map;
}

export function togglePlayerOpposition(db: Database.Database, sessionId: number, playerId: number): void {
  db.prepare(
    `UPDATE session_players
     SET is_opposition = CASE WHEN is_opposition = 0 THEN 1 ELSE 0 END
     WHERE session_id = ? AND player_id = ?`
  ).run(sessionId, playerId);
}

export function updateOppositionScore(
  db: Database.Database,
  sessionId: number,
  score: number,
  attempted: number
): void {
  const result = db
    .prepare('UPDATE sessions SET opposition_score = ?, opposition_attempted = ? WHERE id = ?')
    .run(Math.max(0, score), Math.max(0, attempted), sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function recordShot(
  db: Database.Database,
  sessionId: number,
  playerId: number,
  scored: boolean,
  quarter: number = 1
): Shot {
  return db
    .prepare(
      'INSERT INTO shots (session_id, player_id, scored, quarter) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .get(sessionId, playerId, scored ? 1 : 0, quarter) as Shot;
}

export function undoLastShot(db: Database.Database, sessionId: number, playerId: number): void {
  const last = db
    .prepare(
      `SELECT id
       FROM shots
       WHERE session_id = ? AND player_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    )
    .get(sessionId, playerId) as { id: number } | undefined;

  if (last) db.prepare('DELETE FROM shots WHERE id = ?').run(last.id);
}

export function getPlayerCareerStats(db: Database.Database, playerId: number): PlayerCareerStats {
  const player = getPlayerById(db, playerId);
  if (!player || !player.team_name) throw new Error(`Player ${playerId} not found`);

  const agg = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM session_players sp2 JOIN sessions s2 ON s2.id = sp2.session_id WHERE sp2.player_id = ? AND s2.deleted_at IS NULL) AS sessions_played,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS total_made,
         COALESCE(COUNT(sh.id), 0) AS total_attempted
       FROM shots sh
       JOIN sessions s ON s.id = sh.session_id
       WHERE sh.player_id = ? AND s.deleted_at IS NULL`
    )
    .get(playerId, playerId) as {
      sessions_played: number;
      total_made: number;
      total_attempted: number;
    };

  const careerStatRows = db
    .prepare(
      `SELECT se.stat_type_id, COUNT(*) AS cnt
       FROM stat_events se
       JOIN sessions s ON s.id = se.session_id
       WHERE se.player_id = ? AND s.deleted_at IS NULL
       GROUP BY se.stat_type_id`
    )
    .all(playerId) as { stat_type_id: number; cnt: number }[];

  const career_stat_counts: Record<number, number> = {};
  for (const row of careerStatRows) career_stat_counts[row.stat_type_id] = row.cnt;

  const sessionRows = db
    .prepare(
      `SELECT
         s.id AS session_id,
         s.name AS session_name,
         s.started_at,
         s.team_id,
         t.name AS team_name,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
         COALESCE(COUNT(sh.id), 0) AS attempted
       FROM session_players sp
       JOIN sessions s ON s.id = sp.session_id
       JOIN teams t ON t.id = s.team_id
       LEFT JOIN shots sh ON sh.session_id = s.id AND sh.player_id = ?
       WHERE sp.player_id = ? AND s.deleted_at IS NULL
       GROUP BY s.id
       ORDER BY s.started_at DESC, s.id DESC`
    )
    .all(playerId, playerId) as {
    session_id: number;
    session_name: string | null;
    started_at: string;
    team_id: number;
    team_name: string;
    made: number;
    attempted: number;
  }[];

  const sessionStatRows = db
    .prepare(
      `SELECT se.session_id, se.stat_type_id, COUNT(*) AS cnt
       FROM stat_events se
       JOIN sessions s ON s.id = se.session_id
       WHERE se.player_id = ? AND s.deleted_at IS NULL
       GROUP BY se.session_id, se.stat_type_id`
    )
    .all(playerId) as { session_id: number; stat_type_id: number; cnt: number }[];

  const sessionStatMap = new Map<number, Record<number, number>>();
  for (const row of sessionStatRows) {
    const stats = sessionStatMap.get(row.session_id) ?? {};
    stats[row.stat_type_id] = row.cnt;
    sessionStatMap.set(row.session_id, stats);
  }

  return {
    player_id: playerId,
    name: player.name,
    team_id: player.team_id,
    team_name: player.team_name,
    ...agg,
    career_stat_counts,
    sessions: sessionRows.map(session => ({
      ...session,
      stat_counts: sessionStatMap.get(session.session_id) ?? {},
    })),
  };
}

export function createStatType(db: Database.Database, name: string): StatType {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Stat type name cannot be empty');
  return db.prepare('INSERT INTO stat_types (name) VALUES (?) RETURNING *').get(trimmed) as StatType;
}

export function getAllStatTypes(db: Database.Database, enabledOnly = false): StatType[] {
  const where = enabledOnly ? 'WHERE enabled = 1' : '';
  return db.prepare(`SELECT * FROM stat_types ${where} ORDER BY name ASC`).all() as StatType[];
}

export function toggleStatType(db: Database.Database, id: number): void {
  const result = db.prepare('UPDATE stat_types SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Stat type ${id} not found`);
}

export function getAllLeaderboards(
  db: Database.Database,
  teamId?: number
): { match: Leaderboard[]; career: Leaderboard[] } {
  const match: Leaderboard[] = [];
  const career: Leaderboard[] = [];
  const params = teamId ? { teamId } : {};

  const matchGoals = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         COUNT(*) AS value,
         COALESCE(s.name, 'Training Session') || ' (' || strftime('%d/%m/%y', s.started_at) || ')' AS label
       FROM shots sh
       JOIN players p ON p.id = sh.player_id
       JOIN sessions s ON s.id = sh.session_id
       WHERE sh.scored = 1 AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY sh.session_id, p.id
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (matchGoals.length > 0) {
    match.push({ title: 'Most Goals', subtitle: 'Best individual scoring performance', entries: matchGoals });
  }

  const matchPct = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         ROUND(SUM(CASE WHEN sh.scored = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS value,
         COALESCE(s.name, 'Training Session') || ' (' || strftime('%d/%m/%y', s.started_at) || ')' AS label
       FROM shots sh
       JOIN players p ON p.id = sh.player_id
       JOIN sessions s ON s.id = sh.session_id
       WHERE s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY sh.session_id, p.id
       HAVING COUNT(*) >= 5
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (matchPct.length > 0) {
    match.push({ title: 'Best Shot %', subtitle: 'Min. 5 attempts', format: 'percent', entries: matchPct });
  }

  const matchAttempts = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         COUNT(*) AS value,
         COALESCE(s.name, 'Training Session') || ' (' || strftime('%d/%m/%y', s.started_at) || ')' AS label
       FROM shots sh
       JOIN players p ON p.id = sh.player_id
       JOIN sessions s ON s.id = sh.session_id
       WHERE s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY sh.session_id, p.id
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (matchAttempts.length > 0) {
    match.push({ title: 'Most Shots Taken', subtitle: 'Busiest shooting performances', entries: matchAttempts });
  }

  const careerGoals = db
    .prepare(
      `SELECT p.id AS player_id, p.name, COUNT(*) AS value
       FROM shots sh
       JOIN players p ON p.id = sh.player_id
       JOIN sessions s ON s.id = sh.session_id
       WHERE sh.scored = 1 AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY p.id
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (careerGoals.length > 0) {
    career.push({ title: 'Most Goals', subtitle: 'Total scored across all sessions', entries: careerGoals });
  }

  const careerPct = db
    .prepare(
      `SELECT
         p.id AS player_id,
         p.name,
         ROUND(SUM(CASE WHEN sh.scored = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS value
       FROM shots sh
       JOIN players p ON p.id = sh.player_id
       JOIN sessions s ON s.id = sh.session_id
       WHERE s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
       GROUP BY p.id
       HAVING COUNT(*) >= 10
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (careerPct.length > 0) {
    career.push({ title: 'Best Shot %', subtitle: 'Min. 10 attempts', format: 'percent', entries: careerPct });
  }

  // Combined interceptions (L + W) leaderboard
  const interceptTypes = db.prepare(
    "SELECT id FROM stat_types WHERE enabled = 1 AND name LIKE 'Interception%'"
  ).all() as { id: number }[];
  if (interceptTypes.length > 1) {
    const ids = interceptTypes.map(t => t.id).join(',');
    const matchIntercept = db
      .prepare(
        `SELECT
           p.id AS player_id,
           p.name,
           COUNT(*) AS value,
           COALESCE(s.name, 'Training Session') || ' (' || strftime('%d/%m/%y', s.started_at) || ')' AS label
         FROM stat_events se
         JOIN players p ON p.id = se.player_id
         JOIN sessions s ON s.id = se.session_id
         WHERE se.stat_type_id IN (${ids}) AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
         GROUP BY se.session_id, p.id
         ORDER BY value DESC
         LIMIT 10`
      )
      .all(params) as LeaderboardEntry[];
    if (matchIntercept.length > 0) {
      match.push({ title: 'Most Interceptions (Total)', subtitle: 'All interception types combined', entries: matchIntercept });
    }

    const careerIntercept = db
      .prepare(
        `SELECT
           p.id AS player_id,
           p.name,
           COUNT(*) AS value
         FROM stat_events se
         JOIN players p ON p.id = se.player_id
         JOIN sessions s ON s.id = se.session_id
         WHERE se.stat_type_id IN (${ids}) AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
         GROUP BY p.id
         ORDER BY value DESC
         LIMIT 10`
      )
      .all(params) as LeaderboardEntry[];
    if (careerIntercept.length > 0) {
      career.push({ title: 'Most Interceptions (Total)', subtitle: 'All interception types combined', entries: careerIntercept });
    }
  }

  const statTypes = getAllStatTypes(db, true);
  for (const statType of statTypes) {
    const matchStat = db
      .prepare(
        `SELECT
           p.id AS player_id,
           p.name,
           COUNT(*) AS value,
           COALESCE(s.name, 'Training Session') || ' (' || strftime('%d/%m/%y', s.started_at) || ')' AS label
         FROM stat_events se
         JOIN players p ON p.id = se.player_id
         JOIN sessions s ON s.id = se.session_id
         WHERE se.stat_type_id = @statTypeId AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
         GROUP BY se.session_id, p.id
         ORDER BY value DESC
         LIMIT 10`
      )
      .all({ ...params, statTypeId: statType.id }) as LeaderboardEntry[];

    if (matchStat.length > 0) {
      match.push({
        title: `Most ${statType.name}`,
        subtitle: `Best individual ${statType.name.toLowerCase()} in one session`,
        entries: matchStat,
      });
    }

    const careerStat = db
      .prepare(
        `SELECT
           p.id AS player_id,
           p.name,
           COUNT(*) AS value
         FROM stat_events se
         JOIN players p ON p.id = se.player_id
         JOIN sessions s ON s.id = se.session_id
         WHERE se.stat_type_id = @statTypeId AND s.deleted_at IS NULL${teamId ? ' AND s.team_id = @teamId' : ''}
         GROUP BY p.id
         ORDER BY value DESC
         LIMIT 10`
      )
      .all({ ...params, statTypeId: statType.id }) as LeaderboardEntry[];

    if (careerStat.length > 0) {
      career.push({
        title: `Most ${statType.name}`,
        subtitle: `Total ${statType.name.toLowerCase()} across all sessions`,
        entries: careerStat,
      });
    }
  }

  return { match, career };
}

export function getQuarterLeaderboards(
  db: Database.Database,
  teamId?: number
): Leaderboard[] {
  const teamFilter = teamId ? ' AND s.team_id = @teamId' : '';
  const params = teamId ? { teamId } : {};
  const boards: Leaderboard[] = [];

// Only include sessions where quarters were actually tracked (shots in 2+ distinct quarters)
const multiQShots = `AND sh.session_id IN (
  SELECT session_id FROM shots GROUP BY session_id HAVING COUNT(DISTINCT quarter) >= 2
)`;
const multiQStats = `AND se.session_id IN (
  SELECT session_id FROM shots GROUP BY session_id HAVING COUNT(DISTINCT quarter) >= 2
)`;

  // Best single-quarter goals (per match per quarter)
  const goals = db
    .prepare(
      `SELECT player_id, name, value, 'Q' || quarter AS label FROM (
         SELECT p.id AS player_id, p.name, sh.quarter, COUNT(*) AS value
         FROM shots sh
         JOIN players p ON p.id = sh.player_id
         JOIN sessions s ON s.id = sh.session_id
         WHERE sh.scored = 1 AND s.deleted_at IS NULL${teamFilter} ${multiQShots}
         GROUP BY p.id, sh.session_id, sh.quarter
       ) sub
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as (LeaderboardEntry & { label: string })[];
  if (goals.length > 0) {
    boards.push({ title: 'Most Goals (Quarter)', subtitle: 'Best single-quarter goal tally in one match', entries: goals });
  }

  // Best single-quarter shot % (per match per quarter, min 7 attempts)
  const pct = db
    .prepare(
      `SELECT player_id, name, value, 'Q' || quarter AS label FROM (
         SELECT p.id AS player_id, p.name, sh.quarter,
           ROUND(SUM(CASE WHEN sh.scored = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100) AS value
         FROM shots sh
         JOIN players p ON p.id = sh.player_id
         JOIN sessions s ON s.id = sh.session_id
         WHERE s.deleted_at IS NULL${teamFilter} ${multiQShots}
         GROUP BY p.id, sh.session_id, sh.quarter
         HAVING COUNT(*) >= 7
       ) sub
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as (LeaderboardEntry & { label: string })[];
  if (pct.length > 0) {
    boards.push({ title: 'Best Shot % (Quarter)', subtitle: 'Best single-quarter accuracy (min. 7 attempts)', format: 'percent', entries: pct });
  }

  // Best single-quarter for each stat type
  const statTypes = getAllStatTypes(db, true);
  for (const st of statTypes) {
    const statBoard = db
      .prepare(
        `SELECT player_id, name, value, 'Q' || quarter AS label FROM (
           SELECT p.id AS player_id, p.name, se.quarter, COUNT(*) AS value
           FROM stat_events se
           JOIN players p ON p.id = se.player_id
           JOIN sessions s ON s.id = se.session_id
           WHERE se.stat_type_id = @statTypeId AND s.deleted_at IS NULL${teamFilter} ${multiQStats}
           GROUP BY p.id, se.session_id, se.quarter
         ) sub
         ORDER BY value DESC
         LIMIT 10`
      )
      .all({ ...params, statTypeId: st.id }) as (LeaderboardEntry & { label: string })[];
    if (statBoard.length > 0) {
      boards.push({ title: `${st.name} (Quarter)`, subtitle: `Most ${st.name.toLowerCase()} in one quarter of one match`, entries: statBoard });
    }
  }

  // Combined interceptions — best single quarter
  const interceptTypes = db.prepare(
    "SELECT id FROM stat_types WHERE enabled = 1 AND name LIKE 'Interception%'"
  ).all() as { id: number }[];
  if (interceptTypes.length > 1) {
    const ids = interceptTypes.map(t => t.id).join(',');
    const combined = db
      .prepare(
        `SELECT player_id, name, value, 'Q' || quarter AS label FROM (
           SELECT p.id AS player_id, p.name, se.quarter, COUNT(*) AS value
           FROM stat_events se
           JOIN players p ON p.id = se.player_id
           JOIN sessions s ON s.id = se.session_id
           WHERE se.stat_type_id IN (${ids}) AND s.deleted_at IS NULL${teamFilter} ${multiQStats}
           GROUP BY p.id, se.session_id, se.quarter
         ) sub
         ORDER BY value DESC
         LIMIT 10`
      )
      .all(params) as (LeaderboardEntry & { label: string })[];
    if (combined.length > 0) {
      boards.push({ title: 'Interceptions Total (Quarter)', subtitle: 'Most interceptions (all types) in one quarter of one match', entries: combined });
    }
  }

  return boards;
}

export function getMatchResults(
  db: Database.Database,
  teamId?: number
): (Session & { home: number; opp: number; outcome: 'W' | 'D' | 'L' })[] {
  const sessions = getAllSessions(db, teamId).filter(session => session.ended_at);

  return sessions
    .map(session => {
      const homeGoals = db.prepare(
        `SELECT COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS value
         FROM shots sh
         JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
         WHERE sh.session_id = ? AND sp.is_opposition = 0`
      ).get(session.id) as { value: number };

      const oppGoals = db.prepare(
        `SELECT COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS value
         FROM shots sh
         JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
         WHERE sh.session_id = ? AND sp.is_opposition = 1`
      ).get(session.id) as { value: number };

      const home = homeGoals.value;
      const opp = session.opposition_score + oppGoals.value;
      const outcome: 'W' | 'D' | 'L' = home > opp ? 'W' : home === opp ? 'D' : 'L';
      return { ...session, home, opp, outcome };
    })
    .filter(result => result.home > 0 || result.opp > 0);
}

export function deleteStatType(db: Database.Database, id: number): void {
  const result = db.prepare('DELETE FROM stat_types WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Stat type ${id} not found`);
}

export function renameStatType(db: Database.Database, id: number, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Stat type name cannot be empty');
  const result = db.prepare('UPDATE stat_types SET name = ? WHERE id = ?').run(trimmed, id);
  if (result.changes === 0) throw new Error(`Stat type ${id} not found`);
}

export function recordStatEvent(
  db: Database.Database,
  sessionId: number,
  playerId: number,
  statTypeId: number,
  quarter: number = 1
): void {
  db.prepare(
    'INSERT INTO stat_events (session_id, player_id, stat_type_id, quarter) VALUES (?, ?, ?, ?)'
  ).run(sessionId, playerId, statTypeId, quarter);
}

// --- Feedback ---

export interface Feedback {
  id: number;
  name: string;
  message: string;
  read: number;
  created_at: string;
}

export function submitFeedback(db: Database.Database, name: string, message: string): Feedback {
  const trimmedName = name.trim();
  const trimmedMessage = message.trim();
  if (!trimmedName) throw new Error('Name cannot be empty');
  if (!trimmedMessage) throw new Error('Message cannot be empty');
  return db.prepare('INSERT INTO feedback (name, message) VALUES (?, ?) RETURNING *').get(trimmedName, trimmedMessage) as Feedback;
}

export function getAllFeedback(db: Database.Database): Feedback[] {
  return db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all() as Feedback[];
}

export function markFeedbackRead(db: Database.Database, id: number): void {
  db.prepare('UPDATE feedback SET read = 1 WHERE id = ?').run(id);
}

export function deleteFeedback(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM feedback WHERE id = ?').run(id);
}

// --- Soft-delete recovery ---

export function softDeleteSession(db: Database.Database, sessionId: number): void {
  const sessionCols = db.pragma('table_info(sessions)') as { name: string }[];
  if (!sessionCols.some(col => col.name === 'deleted_at')) return;
  const result = db.prepare("UPDATE sessions SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(sessionId);
  if (result.changes === 0) throw new Error(`Session ${sessionId} not found`);
}

export function restoreSession(db: Database.Database, sessionId: number): void {
  db.prepare('UPDATE sessions SET deleted_at = NULL WHERE id = ?').run(sessionId);
}

export function softDeletePlayer(db: Database.Database, playerId: number): void {
  const playerCols = db.pragma('table_info(players)') as { name: string }[];
  if (!playerCols.some(col => col.name === 'deleted_at')) return;
  const result = db.prepare("UPDATE players SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(playerId);
  if (result.changes === 0) throw new Error(`Player ${playerId} not found`);
}

export function restorePlayer(db: Database.Database, playerId: number): void {
  db.prepare('UPDATE players SET deleted_at = NULL WHERE id = ?').run(playerId);
}

export function softDeleteTeam(db: Database.Database, teamId: number): void {
  const teamCols = db.pragma('table_info(teams)') as { name: string }[];
  if (!teamCols.some(col => col.name === 'deleted_at')) return;
  const result = db.prepare("UPDATE teams SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL").run(teamId);
  if (result.changes === 0) throw new Error(`Team ${teamId} not found`);
}

export function restoreTeam(db: Database.Database, teamId: number): void {
  db.prepare('UPDATE teams SET deleted_at = NULL WHERE id = ?').run(teamId);
}

export function getDeletedSessions(db: Database.Database): Session[] {
  return db.prepare(
    `SELECT s.*, t.name AS team_name FROM sessions s JOIN teams t ON t.id = s.team_id WHERE s.deleted_at IS NOT NULL ORDER BY s.deleted_at DESC`
  ).all() as Session[];
}

export function getDeletedPlayers(db: Database.Database): Player[] {
  return db.prepare(
    `SELECT p.*, t.name AS team_name FROM players p JOIN teams t ON t.id = p.team_id WHERE p.deleted_at IS NOT NULL ORDER BY p.deleted_at DESC`
  ).all() as Player[];
}

export function getDeletedTeams(db: Database.Database): Team[] {
  return db.prepare('SELECT * FROM teams WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all() as Team[];
}

export function undoLastStatEvent(
  db: Database.Database,
  sessionId: number,
  playerId: number,
  statTypeId: number
): void {
  const last = db
    .prepare(
      `SELECT id
       FROM stat_events
       WHERE session_id = ? AND player_id = ? AND stat_type_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    )
    .get(sessionId, playerId, statTypeId) as { id: number } | undefined;

  if (last) db.prepare('DELETE FROM stat_events WHERE id = ?').run(last.id);
}

// --- Messages (Social) ---

export interface Message {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

export function getMessages(db: Database.Database, limit = 50, offset = 0): Message[] {
  return db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Message[];
}

export function getMessageCount(db: Database.Database): number {
  return (db.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number }).count;
}

export function createMessage(db: Database.Database, author: string, content: string): Message {
  const trimAuthor = author.trim();
  const trimContent = content.trim();
  if (!trimAuthor) throw new Error('Name is required');
  if (!trimContent) throw new Error('Message is required');
  if (trimContent.length > 500) throw new Error('Message too long');
  return db.prepare('INSERT INTO messages (author, content) VALUES (?, ?) RETURNING *').get(trimAuthor, trimContent) as Message;
}

export function deleteMessage(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

// --- Announcements (Updates) ---

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'update' | 'match' | 'training' | 'social';
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  opponent: string | null;
  created_at: string;
}

export function getAnnouncements(db: Database.Database): Announcement[] {
  return db.prepare(`
    SELECT * FROM announcements
    ORDER BY
      CASE WHEN event_date IS NOT NULL AND event_date >= date('now') THEN 0 ELSE 1 END,
      event_date ASC,
      created_at DESC
  `).all() as Announcement[];
}

export function getUpcomingAnnouncements(db: Database.Database, limit = 5): Announcement[] {
  return db.prepare(`
    SELECT * FROM announcements
    WHERE (event_date IS NOT NULL AND event_date >= date('now'))
       OR (event_date IS NULL AND created_at >= datetime('now', '-7 days'))
    ORDER BY
      CASE WHEN event_date IS NOT NULL THEN 0 ELSE 1 END,
      event_date ASC,
      created_at DESC
    LIMIT ?
  `).all(limit) as Announcement[];
}

export function createAnnouncement(
  db: Database.Database,
  data: { title: string; content: string; type: string; event_date: string | null; event_time: string | null; location: string | null; opponent: string | null }
): Announcement {
  const t = data.title.trim();
  const c = data.content.trim();
  if (!t) throw new Error('Title is required');
  if (!c) throw new Error('Content is required');
  return db.prepare(
    'INSERT INTO announcements (title, content, type, event_date, event_time, location, opponent) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  ).get(t, c, data.type, data.event_date || null, data.event_time || null, data.location?.trim() || null, data.opponent?.trim() || null) as Announcement;
}

export function updateAnnouncement(
  db: Database.Database,
  id: number,
  data: { title: string; content: string; type: string; event_date: string | null; event_time: string | null; location: string | null; opponent: string | null }
): void {
  db.prepare(
    'UPDATE announcements SET title = ?, content = ?, type = ?, event_date = ?, event_time = ?, location = ?, opponent = ? WHERE id = ?'
  ).run(data.title.trim(), data.content.trim(), data.type, data.event_date || null, data.event_time || null, data.location?.trim() || null, data.opponent?.trim() || null, id);
}

export function deleteAnnouncement(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
}
