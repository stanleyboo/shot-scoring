'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createSession as dbCreate,
  endSession as dbEnd,
  deleteSession as dbDelete,
  renameSession as dbRename,
  reopenSession as dbReopen,
} from '@/lib/db';

export async function createSession(name: string, playerIds: number[]) {
  if (playerIds.length === 0) throw new Error('Select at least one player');
  const session = dbCreate(getDb(), name.trim() || null, playerIds);
  revalidatePath('/');
  revalidatePath('/sessions');
  return session;
}

export async function endSession(sessionId: number) {
  dbEnd(getDb(), sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: number) {
  dbDelete(getDb(), sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
}

export async function reopenSession(sessionId: number) {
  dbReopen(getDb(), sessionId);
  revalidatePath('/');
  revalidatePath('/sessions');
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/summary`);
}

export async function renameSession(sessionId: number, name: string) {
  dbRename(getDb(), sessionId, name.trim() || null);
  revalidatePath(`/sessions/${sessionId}/summary`);
  revalidatePath('/sessions');
}
