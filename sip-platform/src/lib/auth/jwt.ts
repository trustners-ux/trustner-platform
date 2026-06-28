import { SignJWT, jwtVerify } from 'jose';
import type { AdminRole } from './config';

export interface JWTPayload {
  email: string;
  name: string;
  role: AdminRole;
}

const DEV_SECRET = 'dev-secret-change-in-production';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In production, refuse to operate with the fallback dev secret.
    // The fallback string is in source, so anyone could forge admin tokens.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET env var is required in production');
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(secret);
};

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
