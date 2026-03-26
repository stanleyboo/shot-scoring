'use server';

import { revalidatePath } from 'next/cache';
import { getDb, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function addAnnouncement(
  title: string,
  content: string,
  type: string,
  eventDate: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    createAnnouncement(getDb(), title, content, type, eventDate);
    revalidatePath('/updates');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function editAnnouncement(
  id: number,
  title: string,
  content: string,
  type: string,
  eventDate: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    updateAnnouncement(getDb(), id, title, content, type, eventDate);
    revalidatePath('/updates');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function removeAnnouncement(id: number): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  deleteAnnouncement(getDb(), id);
  revalidatePath('/updates');
  revalidatePath('/');
}
