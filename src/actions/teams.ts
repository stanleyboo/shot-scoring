'use server';

import { revalidatePath } from 'next/cache';
import { createTeam as dbCreateTeam, softDeleteTeam as dbSoftDelete, getDb, renameTeam as dbRenameTeam, restoreTeam as dbRestore } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}

export async function createTeam(name: string) {
  await requireAdmin();
  const team = dbCreateTeam(getDb(), name);
  revalidatePath('/');
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/sessions/new');
  revalidatePath('/stats');
  revalidatePath('/admin');
  return team;
}

export async function renameTeam(teamId: number, name: string) {
  await requireAdmin();
  dbRenameTeam(getDb(), teamId, name);
  revalidatePath('/');
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/sessions/new');
  revalidatePath('/stats');
  revalidatePath('/admin');
  revalidatePath(`/teams/${teamId}`);
}

export async function deleteTeam(teamId: number) {
  await requireAdmin();
  dbSoftDelete(getDb(), teamId);
  revalidatePath('/');
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/sessions/new');
  revalidatePath('/stats');
  revalidatePath('/teams');
  revalidatePath('/admin');
}

export async function restoreTeam(teamId: number) {
  await requireAdmin();
  dbRestore(getDb(), teamId);
  revalidatePath('/');
  revalidatePath('/players');
  revalidatePath('/sessions');
  revalidatePath('/sessions/new');
  revalidatePath('/stats');
  revalidatePath('/teams');
  revalidatePath('/admin');
}
