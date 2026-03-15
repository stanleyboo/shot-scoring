'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  recordStatEvent as dbRecord,
  undoLastStatEvent as dbUndo,
} from '@/lib/db';
import { canEdit } from '@/lib/auth';

async function requireCanEdit() {
  if (!(await canEdit())) throw new Error('Unauthorized');
}

export async function recordStatEvent(
  sessionId: number,
  playerId: number,
  statTypeId: number,
  quarter: number = 1
) {
  await requireCanEdit();
  dbRecord(getDb(), sessionId, playerId, statTypeId, quarter);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function undoLastStatEvent(
  sessionId: number,
  playerId: number,
  statTypeId: number
) {
  await requireCanEdit();
  dbUndo(getDb(), sessionId, playerId, statTypeId);
  revalidatePath(`/sessions/${sessionId}`);
}
