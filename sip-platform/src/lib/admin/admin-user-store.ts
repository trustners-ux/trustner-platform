/**
 * Admin User Store — Vercel Blob-backed storage for admin users.
 * Migrates from ADMIN_USERS env var (read-only at runtime) to writable Blob storage.
 * On first load, seeds from env var if Blob doesn't exist (backward compatible).
 */

import { put, list } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import type { AdminUser, AdminRole } from '@/lib/auth/config';

const BLOB_PATH = 'admin/users.json';

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
    const result = await list({ prefix: BLOB_PATH, limit: 1 });

    if (result.blobs.length > 0) {
      const res = await fetch(result.blobs[0].url);
      if (res.ok) {
        const users = (await res.json()) as AdminUser[];
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
  await put(BLOB_PATH, JSON.stringify(users, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add 2 special characters at random positions
  for (let i = 0; i < 2; i++) {
    const pos = Math.floor(Math.random() * password.length);
    const special = specials.charAt(Math.floor(Math.random() * specials.length));
    password = password.slice(0, pos) + special + password.slice(pos);
  }
  return password;
}
