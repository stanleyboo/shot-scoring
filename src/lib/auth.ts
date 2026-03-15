import { cookies } from 'next/headers';
import { getDb } from './db';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345';
const COOKIE_NAME = 'admin_token';
const SESSION_DAYS = 30;

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createAdminSession(): string {
  const db = getDb();
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.prepare(
    'INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)'
  ).run(token, expires.toISOString());
  return token;
}

export function deleteAdminSession(token: string): void {
  getDb().prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const db = getDb();
  // Clean up expired sessions
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();

  const session = db.prepare(
    "SELECT 1 FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token);
  return !!session;
}

export interface AppSettings {
  public_can_create: boolean;
  public_can_edit: boolean;
}

export function getSettings(): AppSettings {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    public_can_create: map.public_can_create === '1',
    public_can_edit: map.public_can_edit === '1',
  };
}

export function updateSetting(key: string, value: boolean): void {
  getDb().prepare('UPDATE settings SET value = ? WHERE key = ?').run(value ? '1' : '0', key);
}

/** Check if the current user can perform an action */
export async function canCreate(): Promise<boolean> {
  const settings = getSettings();
  if (settings.public_can_create) return true;
  return isAdmin();
}

export async function canEdit(): Promise<boolean> {
  const settings = getSettings();
  if (settings.public_can_edit) return true;
  return isAdmin();
}
