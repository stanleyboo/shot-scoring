import Database from 'better-sqlite3';
import {
  applySchema,
  createPlayer,
  getAllPlayers,
  getPlayerById,
  deletePlayer,
  createSession,
  endSession,
  getActiveSession,
  getAllSessions,
  getSessionWithStats,
  recordShot,
  undoLastShot,
  getPlayerCareerStats,
  type Player,
  type Session,
} from './db';

describe('schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    applySchema(db);
  });

  afterEach(() => db.close());

  it('creates all required tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('players');
    expect(names).toContain('sessions');
    expect(names).toContain('session_players');
    expect(names).toContain('shots');
  });

  it('enforces foreign key constraints on shots', () => {
    expect(() => {
      db.prepare('INSERT INTO shots (session_id, player_id, scored) VALUES (999, 999, 1)').run();
    }).toThrow();
  });
});
