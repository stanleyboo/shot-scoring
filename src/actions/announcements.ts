'use server';

import { revalidatePath } from 'next/cache';
import { getDb, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

interface AnnouncementData {
  title: string;
  content: string;
  type: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  opponent: string | null;
}

export async function addAnnouncement(data: AnnouncementData): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    createAnnouncement(getDb(), data);
    revalidatePath('/updates');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function editAnnouncement(id: number, data: AnnouncementData): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Unauthorized' };
  try {
    updateAnnouncement(getDb(), id, data);
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
