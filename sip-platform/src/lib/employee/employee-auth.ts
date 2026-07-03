/**
 * Employee Auth Store — Vercel Blob-backed password + reset-request storage.
 *
 * Credentials are stored separately from the employee directory.
 * The directory is the whitelist; this store tracks auth state.
 */

import { put, list, del, get } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { findEmployeeByEmail, findEmployeeById, getResetApprovalChain } from './employee-directory';
import type { Employee, EmployeeRole } from './employee-directory';

// ─── Types ───────────────────────────────────────────────────

export interface EmployeeCredential {
  employeeId: number;
  email: string;
  passwordHash: string;
  isFirstLogin: boolean;      // true until they set their own password
  createdAt: string;           // ISO date
  lastLoginAt: string | null;
  passwordChangedAt: string;
}

export type ResetRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface PasswordResetRequest {
  id: string;                  // unique request ID
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  requestedAt: string;         // ISO
  status: ResetRequestStatus;
  approverIds: number[];       // who can approve (reporting chain)
  approvedBy: number | null;   // who approved
  resolvedAt: string | null;
  tempPassword: string | null; // set when approved (hashed version stored in credentials)
}

// ─── Blob Paths ──────────────────────────────────────────────

const CREDS_BLOB = 'employee/credentials.json';
const RESETS_BLOB = 'employee/reset-requests.json';

// Password hashes + reset requests are auth-critical PII — stored in the
// dedicated PRIVATE store (its own token, since the original project store
// is public-only and rejects private writes outright).
const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

// ─── Credential CRUD ─────────────────────────────────────────

// addRandomSuffix=true makes writes produce URLs like
// "employee/credentials-XXXXXX.json", so the list prefix must NOT include
// the ".json" extension — we strip it to match versioned blobs.
function listPrefix(path: string): string {
  return path.replace(/\.json$/, '');
}

async function readBlob<T>(path: string, fallback: T[]): Promise<T[]> {
  try {
    // We use addRandomSuffix: true on writes, so we always have to list
    // blobs by prefix and pick the most-recently-uploaded one. This avoids
    // Vercel Blob's public-CDN-doesn't-invalidate-on-overwrite bug, which
    // can make credential changes invisible for up to 30 days.
    const result = await list({ prefix: listPrefix(path), limit: 100, token: PRIVATE_TOKEN });
    if (result.blobs.length === 0) return fallback;
    // Sort by uploadedAt desc to find the latest
    const latest = result.blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    const res = await get(latest.url, { access: 'private', useCache: false, token: PRIVATE_TOKEN });
    if (res?.stream) return (await new Response(res.stream).json()) as T[];
  } catch (err) {
    console.error(`[EmployeeAuth] Blob read failed for ${path}:`, err);
  }
  return fallback;
}

async function writeBlob<T>(path: string, data: T[]): Promise<void> {
  // Use addRandomSuffix: true so every write produces a brand-new URL.
  // This is the only reliable way to defeat Vercel Blob's CDN caching
  // (CDN keys ignore query strings, and the public URL doesn't invalidate
  // on overwrite). After the write, we delete the older versions so the
  // blob doesn't accumulate.
  const result = await put(path, JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
    token: PRIVATE_TOKEN,
  });

  // Cleanup: delete prior versions (best-effort; do not fail the write)
  try {
    const all = await list({ prefix: listPrefix(path), limit: 100, token: PRIVATE_TOKEN });
    const toDelete = all.blobs
      .filter((b) => b.url !== result.url)
      .map((b) => b.url);
    if (toDelete.length > 0) {
      await del(toDelete, { token: PRIVATE_TOKEN });
    }
  } catch (err) {
    console.error(`[EmployeeAuth] Cleanup of stale ${path} blobs failed:`, err);
  }
}

export async function getCredentials(): Promise<EmployeeCredential[]> {
  return readBlob<EmployeeCredential>(CREDS_BLOB, []);
}

async function saveCredentials(creds: EmployeeCredential[]): Promise<void> {
  await writeBlob(CREDS_BLOB, creds);
}

export async function getResetRequests(): Promise<PasswordResetRequest[]> {
  return readBlob<PasswordResetRequest>(RESETS_BLOB, []);
}

async function saveResetRequests(requests: PasswordResetRequest[]): Promise<void> {
  await writeBlob(RESETS_BLOB, requests);
}

// ─── Check Email Status ──────────────────────────────────────

export type EmailCheckResult =
  | { status: 'not_found' }
  | { status: 'new'; employee: Employee }           // first-time, needs password setup
  | { status: 'active'; employee: Employee }         // has password, can login
  | { status: 'inactive'; employee: Employee };       // account deactivated

export async function checkEmployeeEmail(email: string): Promise<EmailCheckResult> {
  const employee = findEmployeeByEmail(email);
  if (!employee) return { status: 'not_found' };
  if (!employee.isActive) return { status: 'inactive', employee };

  const creds = await getCredentials();
  const cred = creds.find(c => c.email.toLowerCase() === email.toLowerCase());

  if (!cred) return { status: 'new', employee };
  return { status: 'active', employee };
}

// ─── First-Time Password Setup ───────────────────────────────

export async function setupPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const employee = findEmployeeByEmail(email);
  if (!employee) return { success: false, error: 'Employee not found' };
  if (!employee.isActive) return { success: false, error: 'Account is inactive' };

  const creds = await getCredentials();
  const existing = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (existing) return { success: false, error: 'Password already set. Use forgot password to reset.' };

  // Validate password strength
  if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  creds.push({
    employeeId: employee.id,
    email: employee.email.toLowerCase(),
    passwordHash,
    isFirstLogin: false,
    createdAt: now,
    lastLoginAt: null,
    passwordChangedAt: now,
  });

  await saveCredentials(creds);
  return { success: true };
}

// ─── Login ───────────────────────────────────────────────────

export async function verifyLogin(
  email: string,
  password: string
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  const employee = findEmployeeByEmail(email);
  if (!employee) return { success: false, error: 'Employee not found' };
  if (!employee.isActive) return { success: false, error: 'Account is inactive' };

  const creds = await getCredentials();
  const cred = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!cred) return { success: false, error: 'Please set up your password first' };

  const valid = await bcrypt.compare(password, cred.passwordHash);
  if (!valid) return { success: false, error: 'Invalid password' };

  // Update last login
  cred.lastLoginAt = new Date().toISOString();
  await saveCredentials(creds);

  return { success: true, employee };
}

// ─── Password Reset Request ──────────────────────────────────

export async function createResetRequest(
  email: string
): Promise<{ success: boolean; approvers?: string[]; error?: string }> {
  const employee = findEmployeeByEmail(email);
  if (!employee) return { success: false, error: 'Employee not found' };
  if (!employee.isActive) return { success: false, error: 'Account is inactive' };

  // Check no pending request already exists
  const requests = await getResetRequests();
  const pending = requests.find(
    r => r.employeeId === employee.id && r.status === 'pending'
  );
  if (pending) {
    return { success: false, error: 'A reset request is already pending. Please wait for approval.' };
  }

  // Get approval chain
  const approvalChain = getResetApprovalChain(employee);
  if (approvalChain.length === 0) {
    // Top-level employee — BOD can self-reset or use admin
    return { success: false, error: 'Please contact the system administrator for password reset.' };
  }

  const request: PasswordResetRequest = {
    id: `RST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeEmail: employee.email,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    approverIds: approvalChain.map(e => e.id),
    approvedBy: null,
    resolvedAt: null,
    tempPassword: null,
  };

  requests.push(request);
  await saveResetRequests(requests);

  return {
    success: true,
    approvers: approvalChain.map(e => e.name),
  };
}

// ─── Approve / Reject Reset ─────────────────────────────────

export async function approveResetRequest(
  requestId: string,
  approverId: number,
  action: 'approve' | 'reject'
): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
  const approver = findEmployeeById(approverId);
  if (!approver) return { success: false, error: 'Approver not found' };

  const requests = await getResetRequests();
  const reqIdx = requests.findIndex(r => r.id === requestId);
  if (reqIdx === -1) return { success: false, error: 'Request not found' };

  const request = requests[reqIdx];
  if (request.status !== 'pending') {
    return { success: false, error: `Request already ${request.status}` };
  }

  // Verify approver has authority
  const isAuthorized =
    request.approverIds.includes(approverId) ||
    approver.role === 'bod' ||
    approver.role === 'cdo';

  if (!isAuthorized) {
    return { success: false, error: 'You are not authorized to approve this request' };
  }

  const now = new Date().toISOString();

  if (action === 'reject') {
    requests[reqIdx] = { ...request, status: 'rejected', approvedBy: approverId, resolvedAt: now };
    await saveResetRequests(requests);
    return { success: true };
  }

  // Approve: generate temp password and reset credentials
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Update or create credential
  const creds = await getCredentials();
  const credIdx = creds.findIndex(
    c => c.email.toLowerCase() === request.employeeEmail.toLowerCase()
  );

  if (credIdx >= 0) {
    creds[credIdx].passwordHash = passwordHash;
    creds[credIdx].isFirstLogin = true;
    creds[credIdx].passwordChangedAt = now;
  } else {
    creds.push({
      employeeId: request.employeeId,
      email: request.employeeEmail.toLowerCase(),
      passwordHash,
      isFirstLogin: true,
      createdAt: now,
      lastLoginAt: null,
      passwordChangedAt: now,
    });
  }

  requests[reqIdx] = {
    ...request,
    status: 'approved',
    approvedBy: approverId,
    resolvedAt: now,
    tempPassword, // store plaintext temporarily for display to approver
  };

  await saveCredentials(creds);
  await saveResetRequests(requests);

  return { success: true, tempPassword };
}

// ─── Get Pending Requests for a Manager ──────────────────────

export async function getPendingRequestsForManager(
  managerId: number
): Promise<PasswordResetRequest[]> {
  const manager = findEmployeeById(managerId);
  if (!manager) return [];

  const requests = await getResetRequests();

  return requests.filter(r => {
    if (r.status !== 'pending') return false;
    // BOD/CDO see all pending
    if (manager.role === 'bod' || manager.role === 'cdo') return true;
    // Others see only their reportees' requests
    return r.approverIds.includes(managerId);
  });
}

// ─── Change Password (logged-in user) ────────────────────────

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const creds = await getCredentials();
  const cred = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!cred) return { success: false, error: 'Credential not found' };

  const valid = await bcrypt.compare(currentPassword, cred.passwordHash);
  if (!valid) return { success: false, error: 'Current password is incorrect' };

  cred.passwordHash = await bcrypt.hash(newPassword, 12);
  cred.isFirstLogin = false;
  cred.passwordChangedAt = new Date().toISOString();
  await saveCredentials(creds);

  return { success: true };
}

// ─── Force-Reset (skip current-password verification) ────────
//
// Used by the force-reset-self endpoint when an authenticated user
// can't supply the current password (e.g., it was rotated while they
// held a valid session). Caller is responsible for verifying the
// session before calling this.

export async function forceResetEmployeePassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  const creds = await getCredentials();
  const cred = creds.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!cred) return { success: false, error: 'Credential not found' };

  cred.passwordHash = await bcrypt.hash(newPassword, 12);
  cred.isFirstLogin = false;
  cred.passwordChangedAt = new Date().toISOString();
  await saveCredentials(creds);

  return { success: true };
}

// ─── Helpers ─────────────────────────────────────────────────

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add 2 special chars
  for (let i = 0; i < 2; i++) {
    const pos = Math.floor(Math.random() * password.length);
    const special = specials.charAt(Math.floor(Math.random() * specials.length));
    password = password.slice(0, pos) + special + password.slice(pos);
  }
  return password;
}
