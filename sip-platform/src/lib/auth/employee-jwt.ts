/**
 * Employee JWT — Separate from admin JWT for the unified employee login system.
 * Uses a different secret and cookie name.
 */

import { SignJWT, jwtVerify } from 'jose';
import type { EmployeeRole } from '@/lib/employee/employee-directory';

export interface EmployeeJWTPayload {
  employeeId: number;
  email: string;
  name: string;
  designation: string;
  department: string;
  companyGroup: string;
  jobLocation: string;
  role: EmployeeRole;
  canApproveResets: boolean;
}

const getSecret = () =>
  new TextEncoder().encode(
    process.env.EMPLOYEE_JWT_SECRET || 'emp-dev-secret-change-in-production'
  );

export async function signEmployeeToken(payload: EmployeeJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret());
}

export async function verifyEmployeeToken(token: string): Promise<EmployeeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      employeeId: payload.employeeId as number,
      email: payload.email as string,
      name: payload.name as string,
      designation: payload.designation as string,
      department: payload.department as string,
      companyGroup: payload.companyGroup as string,
      jobLocation: payload.jobLocation as string,
      role: payload.role as EmployeeRole,
      canApproveResets: payload.canApproveResets as boolean,
    };
  } catch {
    return null;
  }
}

export const EMPLOYEE_COOKIE = 'employee-session';
