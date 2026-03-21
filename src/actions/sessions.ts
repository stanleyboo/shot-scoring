'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createSession as dbCreate,
  endSession as dbEnd,
  softDeleteSession as dbSoftDelete,
  renameSession as dbRename,
  reopenSession as dbReopen,
  updateOppositionScore as dbUpdateScore,
  togglePlayerOpposition as dbToggleOpp,
  setPlayerPosition as dbSetPosition,
  togglePlayerQuarter as dbToggleQuarter,
  getTeamById,
  getSessionById,
  updateSessionTeam as dbUpdateSessionTeam,
  restoreSession as dbRestore,
  removePlayerFromSession as dbRemovePlayer,
} from '@/lib/db';
import { isAdmin, canCreate, canEdit } from '@/lib/auth';

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}

async function requireCanCreate() {
  if (!(await canCreate())) throw new Error('Unauthorized');
}

async function requireCanEdit() {
  if (!(await canEdit())) throw new Error('Unauthorized');
}

export async function createSession(name: string, playerIds: number[], teamId: number) {
  await requireCanCreate();
  if (playerIds.length === 0) throw new Error('Select at least one player');
  const db = getDb();
  if (!getTeamById(db, teamId)) throw new Error('Choose a valid team');
  const session = dbCreate(db, name.trim() || null, playerIds, teamId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath('/stats');
  revalidatePath(`/teams/${teamId}`);
  return session;
}

export async function endSession(sessionId: number) {
  await requireCanEdit();
  const db = getDb();
  const session = getSessionById(db, sessionId);
  dbEnd(db, sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/stats');
  if (session) revalidatePath(`/teams/${session.team_id}`);
}

export async function deleteSession(sessionId: number) {
  await requireAdmin();
  const db = getDb();
  const session = getSessionById(db, sessionId);
  dbSoftDelete(db, sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath('/stats');
  revalidatePath('/admin');
  if (session) revalidatePath(`/teams/${session.team_id}`);
}

export async function restoreSession(sessionId: number) {
  await requireAdmin();
  const db = getDb();
  dbRestore(db, sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath('/stats');
  revalidatePath('/admin');
}

export async function reopenSession(sessionId: number) {
  await requireCanEdit();
  const db = getDb();
  const session = getSessionById(db, sessionId);
  dbReopen(db, sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/summary`);
  revalidatePath('/stats');
  if (session) revalidatePath(`/teams/${session.team_id}`);
}

export async function togglePlayerOpposition(sessionId: number, playerId: number) {
  await requireCanEdit();
  dbToggleOpp(getDb(), sessionId, playerId);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function updateOppositionScore(sessionId: number, score: number, attempted: number) {
  await requireCanEdit();
  dbUpdateScore(getDb(), sessionId, score, attempted);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function renameSession(sessionId: number, name: string) {
  await requireAdmin();
  const db = getDb();
  const session = getSessionById(db, sessionId);
  dbRename(db, sessionId, name.trim() || null);
  revalidatePath(`/sessions/${sessionId}/summary`);
  revalidatePath('/sessions');
  if (session) revalidatePath(`/teams/${session.team_id}`);
}

export async function removePlayerFromSession(sessionId: number, playerId: number) {
  await requireAdmin();
  const db = getDb();
  dbRemovePlayer(db, sessionId, playerId);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/summary`);
  revalidatePath('/sessions');
  revalidatePath('/stats');
  revalidatePath('/players');
}

export async function setPlayerPosition(sessionId: number, playerId: number, position: string | null) {
  await requireCanEdit();
  dbSetPosition(getDb(), sessionId, playerId, position);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function togglePlayerQuarter(sessionId: number, playerId: number, quarter: number) {
  await requireCanEdit();
  const added = dbToggleQuarter(getDb(), sessionId, playerId, quarter);
  revalidatePath(`/sessions/${sessionId}`);
  return added;
}

export async function changeSessionTeam(sessionId: number, teamId: number) {
  await requireAdmin();
  const db = getDb();
  const session = getSessionById(db, sessionId);
  if (!session) throw new Error('Session not found');
  if (!getTeamById(db, teamId)) throw new Error('Choose a valid team');
  dbUpdateSessionTeam(db, sessionId, teamId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath('/stats');
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/summary`);
  revalidatePath(`/teams/${session.team_id}`);
  revalidatePath(`/teams/${teamId}`);
}
