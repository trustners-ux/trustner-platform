import { SignJWT, jwtVerify } from 'jose';
import type { AdminRole } from './config';

export interface JWTPayload {
  email: string;
  name: string;
  role: AdminRole;
}

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = 'admin-session';
