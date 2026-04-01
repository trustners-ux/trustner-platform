import { NextRequest, NextResponse } from 'next/server';
import { verifyRMToken, RM_COOKIE_NAME } from '@/lib/auth/rm-jwt';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import {
  getBusinessEntries,
  createBusinessEntry,
  getMyMonthEntries,
} from '@/lib/dal/business-entries';

/**
 * GET /api/mis/business-entries
 * RM: returns own entries for current/specified month
 * Admin: can pass ?employeeId=X&month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    // Try RM auth first, then admin auth
    let employeeId: number | undefined;
    let isAdmin = false;
    let userName = '';

    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(COOKIE_NAME)?.value;

    if (rmToken) {
      const user = await verifyRMToken(rmToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
      userName = user.name;
    } else if (adminToken) {
      const user = await verifyToken(adminToken);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      isAdmin = user.role === 'admin';
      userName = user.name;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get('month') || undefined;

    if (isAdmin) {
      // Admin can view any employee's entries
      const empIdParam = request.nextUrl.searchParams.get('employeeId');
      const filters: { employeeId?: number; month?: string } = {};
      if (empIdParam) filters.employeeId = parseInt(empIdParam);
      if (month) filters.month = month;
      const entries = await getBusinessEntries(filters);
      return NextResponse.json({ entries, count: entries.length });
    }

    // RM: own entries only
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID not found' }, { status: 400 });
    }

    const entries = await getMyMonthEntries(employeeId, month || undefined);
    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    console.error('Business entries GET error');
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

/**
 * POST /api/mis/business-entries — Create a new business entry
 */
export async function POST(request: NextRequest) {
  try {
    let employeeId: number | undefined;
    let userName = '';

    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(COOKIE_NAME)?.value;

    if (rmToken) {
      const user = await verifyRMToken(rmToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
      userName = user.employeeCode;
    } else if (adminToken) {
      const user = await verifyToken(adminToken);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userName = user.email;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.productId || !body.rawAmount) {
      return NextResponse.json(
        { error: 'Product and amount are required' },
        { status: 400 }
      );
    }

    if (body.rawAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    const entry = await createBusinessEntry(
      {
        employeeId: body.employeeId || employeeId!,
        month: body.month,
        productId: body.productId,
        channelId: body.channelId,
        rawAmount: body.rawAmount,
        channelPayoutPct: body.channelPayoutPct || 0,
        isFpRoute: body.isFpRoute || false,
        policyNumber: body.policyNumber,
        clientName: body.clientName,
        clientPan: body.clientPan,
        insurer: body.insurer,
      },
      userName
    );

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Business entry POST error');
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
