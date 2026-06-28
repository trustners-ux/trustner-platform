/**
 * Read the current portal-session from the request cookies and return
 * the decoded payload. For use in server components + API routes.
 */

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import {
  CLIENT_PORTAL_COOKIE,
  verifyClientPortalToken,
  type ClientPortalJWTPayload,
} from '@/lib/auth/client-portal-jwt';

export async function getPortalSessionFromServer(): Promise<ClientPortalJWTPayload | null> {
  const jar = await cookies();
  const tok = jar.get(CLIENT_PORTAL_COOKIE)?.value;
  if (!tok) return null;
  return verifyClientPortalToken(tok);
}

export async function getPortalSessionFromRequest(req: NextRequest): Promise<ClientPortalJWTPayload | null> {
  const tok = req.cookies.get(CLIENT_PORTAL_COOKIE)?.value;
  if (!tok) return null;
  return verifyClientPortalToken(tok);
}
