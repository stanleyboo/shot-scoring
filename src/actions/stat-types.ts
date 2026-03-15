'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  createStatType as dbCreate,
  deleteStatType as dbDelete,
  renameStatType as dbRename,
  toggleStatType as dbToggle,
} from '@/lib/db';
import { isAdmin } from '@/lib/auth';

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}

export async function createStatType(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Stat type name cannot be empty');
  const statType = dbCreate(getDb(), trimmed);
  revalidatePath('/stats');
  revalidatePath('/sessions');
  return statType;
}

export async function deleteStatType(id: number) {
  await requireAdmin();
  dbDelete(getDb(), id);
  revalidatePath('/stats');
  revalidatePath('/sessions');
}

export async function renameStatType(id: number, name: string) {
  await requireAdmin();
  dbRename(getDb(), id, name);
  revalidatePath('/stats');
  revalidatePath('/sessions');
}

export async function toggleStatType(id: number) {
  await requireAdmin();
  dbToggle(getDb(), id);
  revalidatePath('/stats');
  revalidatePath('/sessions');
}
