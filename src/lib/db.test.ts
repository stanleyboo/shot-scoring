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

describe('player queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    applySchema(db);
  });

  afterEach(() => db.close());

  it('createPlayer inserts and returns a player', () => {
    const player = createPlayer(db, 'Alice');
    expect(player.id).toBeGreaterThan(0);
    expect(player.name).toBe('Alice');
  });

  it('createPlayer throws on duplicate name', () => {
    createPlayer(db, 'Alice');
    expect(() => createPlayer(db, 'Alice')).toThrow();
  });

  it('getAllPlayers returns players ordered by name', () => {
    createPlayer(db, 'Zara');
    createPlayer(db, 'Alice');
    const players = getAllPlayers(db);
    expect(players).toHaveLength(2);
    expect(players[0].name).toBe('Alice');
    expect(players[1].name).toBe('Zara');
  });

  it('getPlayerById returns null for unknown id', () => {
    expect(getPlayerById(db, 999)).toBeNull();
  });

  it('deletePlayer removes player with no shots', () => {
    const player = createPlayer(db, 'Alice');
    deletePlayer(db, player.id);
    expect(getAllPlayers(db)).toHaveLength(0);
  });

  it('deletePlayer throws if player has shots', () => {
    const player = createPlayer(db, 'Alice');
    const session = db
      .prepare('INSERT INTO sessions (name) VALUES (?) RETURNING *')
      .get('Test') as { id: number };
    db.prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, 1)'
    ).run(session.id, player.id);
    expect(() => deletePlayer(db, player.id)).toThrow(/has shot history/);
  });
});
