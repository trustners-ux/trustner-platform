// ─── RM (Relationship Manager) JWT Authentication ───
// Separate from admin auth — different secret, different payload, different cookie

import { SignJWT, jwtVerify } from 'jose';

export interface RMJWTPayload {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  segment: string;
  entity: string;
  role: 'rm' | 'manager' | 'super_admin';
}

const getSecret = () =>
  new TextEncoder().encode(process.env.RM_JWT_SECRET || 'rm-dev-secret-change-in-production');

export async function signRMToken(payload: RMJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h') // Shorter for field staff
    .sign(getSecret());
}

export async function verifyRMToken(token: string): Promise<RMJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      employeeId: payload.employeeId as number,
      employeeCode: payload.employeeCode as string,
      name: payload.name as string,
      designation: payload.designation as string,
      segment: payload.segment as string,
      entity: payload.entity as string,
      role: payload.role as RMJWTPayload['role'],
    };
  } catch {
    return null;
  }
}

export const RM_COOKIE_NAME = 'rm-session';

/**
 * Determine RM role based on level code
 */
export function getRMRole(levelCode: string): RMJWTPayload['role'] {
  if (levelCode === 'L1') return 'super_admin';
  if (['L2', 'L3', 'L4', 'L5'].includes(levelCode)) return 'manager';
  return 'rm';
}
