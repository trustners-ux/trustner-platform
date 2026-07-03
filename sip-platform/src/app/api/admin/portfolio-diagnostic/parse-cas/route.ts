/**
 * Portfolio Diagnostic — CAS PDF Parse API
 *
 * Accepts a multipart form with a CAS PDF and optional password.
 * Returns parsed holdings + SIPs.
 *
 * Route: POST /api/admin/portfolio-diagnostic/parse-cas
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { parseCasPdf } from '@/lib/portfolio-diagnostic/cas-parser';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // Auth check
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `File too large (max 10 MB)` },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Read into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Parse — empty string password is treated as no password.
    // Most Trustner Valuation Reports are not password-protected;
    // only CAMS / Karvy CAS files require a PAN-based password.
    const trimmedPassword = (password ?? '').trim();
    const result = await parseCasPdf({
      pdfBuffer,
      password: trimmedPassword.length > 0 ? trimmedPassword : undefined,
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
