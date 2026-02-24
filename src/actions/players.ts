'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createPlayer as dbCreate,
  deletePlayer as dbDelete,
  renamePlayer as dbRename,
} from '@/lib/db';

export async function createPlayer(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  const player = dbCreate(getDb(), trimmed);
  revalidatePath('/players');
  revalidatePath('/sessions/new');
  return player;
}

export async function deletePlayer(playerId: number) {
  dbDelete(getDb(), playerId);
  revalidatePath('/players');
  revalidatePath('/sessions');
}

export async function renamePlayer(playerId: number, name: string) {
  dbRename(getDb(), playerId, name);
  revalidatePath('/players');
  revalidatePath(`/players/${playerId}`);
  revalidatePath('/sessions');
}
