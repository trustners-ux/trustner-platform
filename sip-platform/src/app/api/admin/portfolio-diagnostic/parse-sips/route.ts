/**
 * Portfolio Diagnostic — SIP File Parse API
 *
 * Accepts a multipart form with a SIP file (XLSX/CSV/PDF).
 * Returns parsed RawSip[] + warnings (stopped SIPs etc.).
 *
 * Route: POST /api/admin/portfolio-diagnostic/parse-sips
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { parseSipFile } from '@/lib/portfolio-diagnostic/sip-parser';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — SIP files are tiny

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 5 MB)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parseSipFile({
      buffer,
      filename: file.name,
      mimeType: file.type || undefined,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error((e as Error).message);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifyToken(adminToken))) return true;
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken && (await verifyEmployeeToken(empToken))) return true;
  return false;
}
