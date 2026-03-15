'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  submitFeedback as dbSubmit,
  markFeedbackRead as dbMarkRead,
  deleteFeedback as dbDeleteFeedback,
} from '@/lib/db';
import { isAdmin } from '@/lib/auth';

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized');
}

export async function submitFeedback(name: string, message: string) {
  dbSubmit(getDb(), name, message);
  revalidatePath('/feedback');
  revalidatePath('/admin');
}

export async function markFeedbackRead(id: number) {
  await requireAdmin();
  dbMarkRead(getDb(), id);
  revalidatePath('/admin');
}

export async function deleteFeedback(id: number) {
  await requireAdmin();
  dbDeleteFeedback(getDb(), id);
  revalidatePath('/admin');
}
