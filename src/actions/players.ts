'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createPlayer as dbCreate,
  softDeletePlayer as dbSoftDelete,
  renamePlayer as dbRename,
  getTeamById,
  getPlayerById,
  updatePlayerTeam as dbUpdatePlayerTeam,
  restorePlayer as dbRestore,
} from '@/lib/db';
import { isAdmin } from '@/lib/auth';

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}

export async function createPlayer(name: string, teamId: number) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  const db = getDb();
  if (!getTeamById(db, teamId)) throw new Error('Choose a valid team');
  const player = dbCreate(db, trimmed, teamId);
  revalidatePath('/players');
  revalidatePath('/sessions/new');
  revalidatePath(`/teams/${teamId}`);
  return player;
}

export async function deletePlayer(playerId: number) {
  await requireAdmin();
  const db = getDb();
  const player = getPlayerById(db, playerId);
  dbSoftDelete(db, playerId);
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/admin');
  if (player) revalidatePath(`/teams/${player.team_id}`);
}

export async function restorePlayer(playerId: number) {
  await requireAdmin();
  const db = getDb();
  dbRestore(db, playerId);
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/admin');
}

export async function renamePlayer(playerId: number, name: string) {
  await requireAdmin();
  const db = getDb();
  const player = getPlayerById(db, playerId);
  dbRename(db, playerId, name);
  revalidatePath('/players');
  revalidatePath(`/players/${playerId}`);
  revalidatePath('/sessions');
  if (player) revalidatePath(`/teams/${player.team_id}`);
}

export async function movePlayerTeam(playerId: number, teamId: number) {
  await requireAdmin();
  const db = getDb();
  const player = getPlayerById(db, playerId);
  if (!player) throw new Error('Player not found');
  if (!getTeamById(db, teamId)) throw new Error('Choose a valid team');
  dbUpdatePlayerTeam(db, playerId, teamId);
  revalidatePath('/players');
  revalidatePath('/sessions/new');
  revalidatePath(`/players/${playerId}`);
  revalidatePath(`/teams/${player.team_id}`);
  revalidatePath(`/teams/${teamId}`);
}

export async function archivePlayer(playerId: number) {
  await requireAdmin();
  const db = getDb();
  db.prepare("UPDATE players SET archived_at = datetime('now') WHERE id = ?").run(playerId);
  revalidatePath('/players');
  revalidatePath('/sessions/new');
}

export async function unarchivePlayer(playerId: number) {
  await requireAdmin();
  const db = getDb();
  db.prepare('UPDATE players SET archived_at = NULL WHERE id = ?').run(playerId);
  revalidatePath('/players');
  revalidatePath('/sessions/new');
}
