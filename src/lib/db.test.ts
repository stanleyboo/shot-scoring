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

describe('session queries', () => {
  let db: Database.Database;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    applySchema(db);
    player1 = createPlayer(db, 'Alice');
    player2 = createPlayer(db, 'Bob');
  });

  afterEach(() => db.close());

  it('createSession creates a session with players', () => {
    const session = createSession(db, 'Morning Training', [player1.id, player2.id]);
    expect(session.id).toBeGreaterThan(0);
    expect(session.name).toBe('Morning Training');
    expect(session.ended_at).toBeNull();
  });

  it('getActiveSession returns null when no active sessions', () => {
    expect(getActiveSession(db)).toBeNull();
  });

  it('getActiveSession returns the open session', () => {
    createSession(db, 'Test', [player1.id]);
    const active = getActiveSession(db);
    expect(active).not.toBeNull();
    expect(active!.name).toBe('Test');
  });

  it('endSession sets ended_at', () => {
    const session = createSession(db, 'Test', [player1.id]);
    endSession(db, session.id);
    expect(getActiveSession(db)).toBeNull();
    const all = getAllSessions(db);
    expect(all[0].ended_at).not.toBeNull();
  });

  it('getAllSessions returns sessions newest first', () => {
    createSession(db, 'First', [player1.id]);
    const s2 = createSession(db, 'Second', [player1.id]);
    endSession(db, s2.id);
    const sessions = getAllSessions(db);
    expect(sessions[0].name).toBe('Second');
    expect(sessions[1].name).toBe('First');
  });

  it('getSessionWithStats returns per-player shot counts', () => {
    const session = createSession(db, 'Test', [player1.id, player2.id]);
    db.prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, ?)'
    ).run(session.id, player1.id, 1);
    db.prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, ?)'
    ).run(session.id, player1.id, 0);
    db.prepare(
      'INSERT INTO shots (session_id, player_id, scored) VALUES (?, ?, ?)'
    ).run(session.id, player2.id, 1);

    const stats = getSessionWithStats(db, session.id);
    expect(stats).not.toBeNull();
    expect(stats!.players).toHaveLength(2);
    const alice = stats!.players.find(p => p.player_id === player1.id)!;
    expect(alice.made).toBe(1);
    expect(alice.attempted).toBe(2);
    const bob = stats!.players.find(p => p.player_id === player2.id)!;
    expect(bob.made).toBe(1);
    expect(bob.attempted).toBe(1);
  });
});
