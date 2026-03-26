'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  checkPassword,
  createAdminSession,
  deleteAdminSession,
  isAdmin,
  updateSetting,
} from '@/lib/auth';

const COOKIE_NAME = 'admin_token';
const SESSION_DAYS = 30;

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!checkPassword(password)) {
    return { ok: false, error: 'Wrong password' };
  }
  const token = createAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    deleteAdminSession(token);
    cookieStore.delete(COOKIE_NAME);
  }
  revalidatePath('/');
}

const ALLOWED_SETTINGS = [
  'public_can_create', 'public_can_edit',
  'page_matches', 'page_players', 'page_teams', 'page_stats',
  'page_feedback', 'page_social', 'page_updates',
];

export async function updateAdminSetting(key: string, value: boolean | string): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized');
  if (!ALLOWED_SETTINGS.includes(key)) {
    throw new Error('Invalid setting');
  }
  updateSetting(key, value);
  revalidatePath('/');
}
