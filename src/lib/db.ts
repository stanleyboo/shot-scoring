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
  created_at: string;
}

export interface SessionWithStats {
  session: Session;
  players: {
    player_id: number;
    name: string;
    made: number;
    attempted: number;
    is_opposition: boolean;
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

  db.prepare('UPDATE players SET team_id = ? WHERE team_id IS NULL').run(defaultTeamId);
  db.prepare('UPDATE sessions SET team_id = ? WHERE team_id IS NULL').run(defaultTeamId);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_team_id ON sessions(team_id);
    CREATE INDEX IF NOT EXISTS idx_shots_session_player ON shots(session_id, player_id);
    CREATE INDEX IF NOT EXISTS idx_stat_events_session_player ON stat_events(session_id, player_id);
  `);

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

export function renameTeam(db: Database.Database, teamId: number, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name cannot be empty');
  const result = db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(trimmed, teamId);
  if (result.changes === 0) throw new Error(`Team ${teamId} not found`);
}

export function getAllTeams(db: Database.Database): Team[] {
  return db.prepare('SELECT * FROM teams ORDER BY name ASC').all() as Team[];
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
         (SELECT COUNT(*) FROM sessions WHERE team_id = @teamId AND ended_at IS NOT NULL) AS session_count,
         COALESCE((
           SELECT SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END)
           FROM shots sh
           JOIN sessions s ON s.id = sh.session_id
           JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
           WHERE s.team_id = @teamId AND sp.is_opposition = 0
         ), 0) AS total_goals,
         COALESCE((
           SELECT COUNT(*)
           FROM shots sh
           JOIN sessions s ON s.id = sh.session_id
           JOIN session_players sp ON sp.session_id = sh.session_id AND sp.player_id = sh.player_id
           WHERE s.team_id = @teamId AND sp.is_opposition = 0
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

export function getAllPlayers(db: Database.Database, teamId?: number): Player[] {
  return db
    .prepare(
      `SELECT p.*, t.name AS team_name
       FROM players p
       JOIN teams t ON t.id = p.team_id
       ${teamId ? 'WHERE p.team_id = @teamId' : ''}
       ORDER BY t.name ASC, p.name ASC`
    )
    .all(teamId ? { teamId } : {}) as Player[];
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
         WHERE s.ended_at IS NULL
         ORDER BY s.started_at DESC, s.id DESC
         LIMIT 1`
      )
      .get() as Session | undefined) ?? null
  );
}

export function getAllSessions(
  db: Database.Database,
  teamId?: number
): (Session & { player_count: number; total_shots: number })[] {
  return db
    .prepare(
      `SELECT
         s.*,
         t.name AS team_name,
         COUNT(DISTINCT CASE WHEN sp.is_opposition = 0 THEN sp.player_id END) AS player_count,
         COUNT(sh.id) AS total_shots
       FROM sessions s
       JOIN teams t ON t.id = s.team_id
       LEFT JOIN session_players sp ON sp.session_id = s.id
       LEFT JOIN shots sh ON sh.session_id = s.id AND sh.player_id = sp.player_id
       ${teamId ? 'WHERE s.team_id = @teamId' : ''}
       GROUP BY s.id
       ORDER BY s.started_at DESC, s.id DESC`
    )
    .all(teamId ? { teamId } : {}) as (Session & { player_count: number; total_shots: number })[];
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
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS made,
         COALESCE(COUNT(sh.id), 0) AS attempted
       FROM session_players sp
       JOIN players p ON p.id = sp.player_id
       LEFT JOIN shots sh ON sh.player_id = p.id AND sh.session_id = ?
       WHERE sp.session_id = ?
       GROUP BY p.id, p.name, sp.is_opposition
       ORDER BY sp.is_opposition ASC, p.name ASC`
    )
    .all(sessionId, sessionId) as {
    player_id: number;
    name: string;
    is_opposition: number;
    made: number;
    attempted: number;
  }[];

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
      stat_counts: statMap.get(player.player_id) ?? {},
    })),
  };
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
  scored: boolean
): Shot {
  return db
    .prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, ?) RETURNING *'
    )
    .get(sessionId, playerId, scored ? 1 : 0) as Shot;
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
         (SELECT COUNT(*) FROM session_players WHERE player_id = ?) AS sessions_played,
         COALESCE(SUM(CASE WHEN sh.scored = 1 THEN 1 ELSE 0 END), 0) AS total_made,
         COALESCE(COUNT(sh.id), 0) AS total_attempted
       FROM shots sh
       WHERE sh.player_id = ?`
    )
    .get(playerId, playerId) as {
      sessions_played: number;
      total_made: number;
      total_attempted: number;
    };

  const careerStatRows = db
    .prepare(
      `SELECT stat_type_id, COUNT(*) AS cnt
       FROM stat_events
       WHERE player_id = ?
       GROUP BY stat_type_id`
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
       WHERE sp.player_id = ?
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
      `SELECT session_id, stat_type_id, COUNT(*) AS cnt
       FROM stat_events
       WHERE player_id = ?
       GROUP BY session_id, stat_type_id`
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

export function getAllStatTypes(db: Database.Database): StatType[] {
  return db.prepare('SELECT * FROM stat_types ORDER BY name ASC').all() as StatType[];
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
       WHERE sh.scored = 1${teamId ? ' AND s.team_id = @teamId' : ''}
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
       ${teamId ? 'WHERE s.team_id = @teamId' : ''}
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
       ${teamId ? 'WHERE s.team_id = @teamId' : ''}
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
       ${teamId ? 'WHERE s.team_id = @teamId AND sh.scored = 1' : 'WHERE sh.scored = 1'}
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
       ${teamId ? 'WHERE s.team_id = @teamId' : ''}
       GROUP BY p.id
       HAVING COUNT(*) >= 10
       ORDER BY value DESC
       LIMIT 10`
    )
    .all(params) as LeaderboardEntry[];
  if (careerPct.length > 0) {
    career.push({ title: 'Best Shot %', subtitle: 'Min. 10 attempts', format: 'percent', entries: careerPct });
  }

  const statTypes = getAllStatTypes(db);
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
         ${teamId ? 'WHERE s.team_id = @teamId AND se.stat_type_id = @statTypeId' : 'WHERE se.stat_type_id = @statTypeId'}
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
         ${teamId ? 'WHERE s.team_id = @teamId AND se.stat_type_id = @statTypeId' : 'WHERE se.stat_type_id = @statTypeId'}
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
  statTypeId: number
): void {
  db.prepare(
    'INSERT INTO stat_events (session_id, player_id, stat_type_id) VALUES (?, ?, ?)'
  ).run(sessionId, playerId, statTypeId);
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
