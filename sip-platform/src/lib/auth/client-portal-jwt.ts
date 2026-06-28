/**
 * Client-Portal JWT — for clients logging into the merasip.com portal.
 *
 * Distinct from the admin / employee / RM JWTs:
 *   - Different secret (CLIENT_PORTAL_JWT_SECRET)
 *   - Different cookie name (client-portal-session)
 *   - Moderate expiry (14d) — long enough that clients (who don't sign in
 *     daily like staff) aren't nagged, short enough to bound a stolen-cookie
 *     window on a financial portal (audit P1, tightened from 30d Jun 2026).
 *
 * Payload carries the bare minimum so the portal can render without an
 * extra DB roundtrip on every request: portal_user_id + linked client_id
 * + display_name.
 */

import { SignJWT, jwtVerify } from 'jose';

export interface ClientPortalJWTPayload {
  portalUserId: number;
  clientId: number;
  clientCode: string;
  displayName: string;
  loginMobile: string | null;
  loginEmail: string | null;
}

const DEV_SECRET = 'client-portal-dev-secret-change-in-production';

const getSecret = () => {
  const secret = process.env.CLIENT_PORTAL_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CLIENT_PORTAL_JWT_SECRET env var is required in production');
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(secret);
};

export async function signClientPortalToken(payload: ClientPortalJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(getSecret());
}

export async function verifyClientPortalToken(token: string): Promise<ClientPortalJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      portalUserId: payload.portalUserId as number,
      clientId: payload.clientId as number,
      clientCode: payload.clientCode as string,
      displayName: payload.displayName as string,
      loginMobile: (payload.loginMobile as string | null) ?? null,
      loginEmail: (payload.loginEmail as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export const CLIENT_PORTAL_COOKIE = 'client-portal-session';
