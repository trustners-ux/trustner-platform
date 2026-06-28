/**
 * Resolve the signed-in actor for client-master routes.
 *
 * Accepts EITHER (a) the admin JWT cookie OR (b) the employee JWT cookie,
 * mirroring the dual-cookie behaviour in src/middleware.ts. Returns an
 * actor + adminRole that the permission helpers in ./permissions.ts read.
 */

import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import type { AdminRole } from '@/lib/auth/config';
import { employeeRoleToAdmin } from './permissions';
import type { ClientsActor } from './types';

export interface ResolvedActor {
  actor: ClientsActor;
  role: AdminRole | undefined;
  name: string;
}

async function resolveFromTokens(
  adminTok: string | undefined,
  empTok: string | undefined,
): Promise<ResolvedActor | null> {
  // Prefer employee JWT — Trustner staff sign in via the unified employee
  // login. Admin JWT is the legacy email/password admin path.
  if (empTok) {
    try {
      const payload = await verifyEmployeeToken(empTok);
      if (payload) {
        return {
          actor: { user_id: payload.employeeId, email: payload.email },
          role: employeeRoleToAdmin(payload.role),
          name: payload.name,
        };
      }
    } catch { /* fall through to admin */ }
  }
  if (adminTok) {
    try {
      const payload = await verifyToken(adminTok);
      if (payload) {
        // Admin JWT carries email + role directly. Use 0 as user_id placeholder
        // — admin tier doesn't have an employee row, but onboarded_by_user_id
        // accepts any integer.
        return {
          actor: { user_id: 0, email: payload.email },
          role: payload.role as AdminRole,
          name: payload.name || payload.email,
        };
      }
    } catch { /* fall through */ }
  }
  return null;
}

/** API-route variant — reads cookies from the request directly. */
export async function getRequestActor(req: NextRequest): Promise<ResolvedActor | null> {
  const empTok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  const adminTok = req.cookies.get(COOKIE_NAME)?.value;
  return resolveFromTokens(adminTok, empTok);
}

/** Server-component variant — reads cookies via next/headers. */
export async function getServerActor(): Promise<ResolvedActor | null> {
  const jar = await cookies();
  const empTok = jar.get(EMPLOYEE_COOKIE)?.value;
  const adminTok = jar.get(COOKIE_NAME)?.value;
  return resolveFromTokens(adminTok, empTok);
}
