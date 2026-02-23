'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createSession as dbCreate,
  endSession as dbEnd,
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
