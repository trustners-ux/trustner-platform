/**
 * Admin User Store — Vercel Blob-backed storage for admin users.
 * Migrates from ADMIN_USERS env var (read-only at runtime) to writable Blob storage.
 * On first load, seeds from env var if Blob doesn't exist (backward compatible).
 */

import { randomInt } from 'crypto';
import { put, list, del, get } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import type { AdminUser, AdminRole } from '@/lib/auth/config';

const BLOB_PATH = 'admin/users.json';
// addRandomSuffix=true makes writes produce URLs like "admin/users-XXXXXX.json",
// so the list prefix must NOT include the ".json" extension.
const BLOB_LIST_PREFIX = 'admin/users';

// Admin password hashes are auth-critical PII — stored in the dedicated
// PRIVATE store (its own token; the original project store is public-only
// and rejects private writes outright).
const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

// ─── Super Admin — cannot be deleted, requires dual OTP ───
export const SUPER_ADMIN_EMAIL = 'ram@trustner.in';
export const SUPER_ADMIN_PHONE = '9864051214';

// Users who can reset passwords (super admin + authorized admins)
export const PASSWORD_RESET_AUTHORIZED = [
  'ram@trustner.in',
  'sangeeta@trustner.in',
];

export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function canResetPasswords(email: string): boolean {
  return PASSWORD_RESET_AUTHORIZED.some(
    (e) => e.toLowerCase() === email.toLowerCase()
  );
}

// ─── Read from Blob (with env-var seed fallback) ───

export async function getAdminUsersFromBlob(): Promise<AdminUser[]> {
  try {
    // We use addRandomSuffix: true on writes, so we always pick the
    // most-recently-uploaded blob. This avoids Vercel Blob's
    // public-CDN-doesn't-invalidate-on-overwrite bug, which can make
    // password changes invisible for up to 30 days.
    const result = await list({ prefix: BLOB_LIST_PREFIX, limit: 100, token: PRIVATE_TOKEN });

    if (result.blobs.length > 0) {
      const latest = result.blobs
        .slice()
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
      const res = await get(latest.url, { access: 'private', useCache: false, token: PRIVATE_TOKEN });
      if (res?.stream) {
        const users = (await new Response(res.stream).json()) as AdminUser[];
        return users;
      }
    }
  } catch (err) {
    console.error('[AdminUserStore] Blob read failed, falling back to env:', err);
  }

  // Fallback: seed from env var
  const envUsers = getEnvUsers();
  if (envUsers.length > 0) {
    // Auto-seed Blob on first access
    try {
      await saveUsers(envUsers);
      console.log('[AdminUserStore] Seeded Blob from ADMIN_USERS env var');
    } catch (seedErr) {
      console.error('[AdminUserStore] Failed to seed Blob:', seedErr);
    }
  }
  return envUsers;
}

// Parse env var (sync helper, only used for seeding)
function getEnvUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdminUser[];
  } catch {
    console.error('[AdminUserStore] Failed to parse ADMIN_USERS env var');
    return [];
  }
}

// ─── Write to Blob ───

async function saveUsers(users: AdminUser[]): Promise<void> {
  // Use addRandomSuffix: true so every write produces a brand-new URL.
  // This is the only reliable way to defeat Vercel Blob's CDN caching
  // (CDN keys ignore query strings, and the public URL doesn't invalidate
  // on overwrite). After the write, we delete the older versions.
  const result = await put(BLOB_PATH, JSON.stringify(users, null, 2), {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
    token: PRIVATE_TOKEN,
  });

  // Cleanup older versions (best-effort)
  try {
    const all = await list({ prefix: BLOB_LIST_PREFIX, limit: 100, token: PRIVATE_TOKEN });
    const toDelete = all.blobs
      .filter((b) => b.url !== result.url)
      .map((b) => b.url);
    if (toDelete.length > 0) {
      await del(toDelete, { token: PRIVATE_TOKEN });
    }
  } catch (err) {
    console.error('[AdminUserStore] Cleanup of stale blobs failed:', err);
  }
}

// ─── Find User ───

export async function findUserByEmailFromBlob(
  email: string
): Promise<AdminUser | undefined> {
  const users = await getAdminUsersFromBlob();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ─── Add User ───

export async function addAdminUser(params: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}): Promise<void> {
  const users = await getAdminUsersFromBlob();

  // Check for duplicate email
  if (users.some((u) => u.email.toLowerCase() === params.email.toLowerCase())) {
    throw new Error('A user with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(params.password, 12);

  const newUser: AdminUser = {
    email: params.email.toLowerCase().trim(),
    name: params.name.trim(),
    passwordHash,
    role: params.role,
  };

  users.push(newUser);
  await saveUsers(users);
}

// ─── Delete User ───

export async function deleteAdminUser(
  email: string,
  requestingUserEmail: string
): Promise<void> {
  // Hard-block: super admin cannot be deleted
  if (isSuperAdmin(email)) {
    throw new Error('Super Admin account cannot be deleted. This action is permanently blocked.');
  }

  const users = await getAdminUsersFromBlob();

  // Prevent self-deletion
  if (email.toLowerCase() === requestingUserEmail.toLowerCase()) {
    throw new Error('You cannot delete your own account');
  }

  // Prevent deleting the last admin
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const targetUser = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!targetUser) {
    throw new Error('User not found');
  }

  if (targetUser.role === 'admin' && adminCount <= 1) {
    throw new Error('Cannot delete the last admin user');
  }

  const filtered = users.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  );
  await saveUsers(filtered);
}

// ─── Reset Password ───

export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<void> {
  const users = await getAdminUsersFromBlob();
  const index = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (index === -1) {
    throw new Error('User not found');
  }

  users[index].passwordHash = await bcrypt.hash(newPassword, 12);
  await saveUsers(users);
}

// ─── Update Role ───

export async function updateUserRole(
  email: string,
  newRole: AdminRole,
  requestingUserEmail: string
): Promise<void> {
  // Super admin role cannot be changed
  if (isSuperAdmin(email) && newRole !== 'admin') {
    throw new Error('Super Admin role cannot be modified');
  }

  const users = await getAdminUsersFromBlob();
  const index = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (index === -1) {
    throw new Error('User not found');
  }

  // Prevent demoting the last admin
  if (users[index].role === 'admin' && newRole !== 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last admin user');
    }
  }

  // Prevent self-demotion
  if (
    email.toLowerCase() === requestingUserEmail.toLowerCase() &&
    newRole !== 'admin'
  ) {
    throw new Error('You cannot demote your own admin role');
  }

  users[index].role = newRole;
  await saveUsers(users);
}

// ─── Generate Secure Password ───

export function generateSecurePassword(): string {
  // CSPRNG (audit P1-3) — this becomes a real account credential emailed to a
  // user, so it must not come from Math.random.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(randomInt(chars.length));
  }
  // Add 2 special characters at random positions
  for (let i = 0; i < 2; i++) {
    const pos = randomInt(password.length + 1);
    const special = specials.charAt(randomInt(specials.length));
    password = password.slice(0, pos) + special + password.slice(pos);
  }
  return password;
}
