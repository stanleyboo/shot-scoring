'use server';

import { revalidatePath } from 'next/cache';
import { getDb, createMessage, deleteMessage } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function postMessage(author: string, content: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getDb();
    createMessage(db, author, content);
    revalidatePath('/social');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function removeMessage(id: number): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  deleteMessage(getDb(), id);
  revalidatePath('/social');
}
