'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  recordShot as dbRecord,
  undoLastShot as dbUndo,
} from '@/lib/db';

export async function recordShot(
  sessionId: number,
  playerId: number,
  scored: boolean
) {
  const shot = dbRecord(getDb(), sessionId, playerId, scored);
  revalidatePath(`/sessions/${sessionId}`);
  return shot;
}

export async function undoLastShot(sessionId: number, playerId: number) {
  dbUndo(getDb(), sessionId, playerId);
  revalidatePath(`/sessions/${sessionId}`);
}
