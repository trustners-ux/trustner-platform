import { NextRequest, NextResponse } from 'next/server';
import { verifyRMToken, RM_COOKIE_NAME } from '@/lib/auth/rm-jwt';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import {
  getBusinessEntries,
  createBusinessEntry,
  getMyMonthEntries,
  getBusinessAnalytics,
  BusinessEntryFilters,
} from '@/lib/dal/business-entries';

/**
 * Validate that a date range does not exceed 60 days.
 * Returns an error string if invalid, or null if OK.
 */
function validateDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date format. Use YYYY-MM-DD.';
  }
  if (end < start) {
    return 'endDate must be on or after startDate.';
  }
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > 60) {
    return `Date range exceeds 60 days (${Math.round(diffDays)} days). Maximum allowed is 60 days.`;
  }
  return null;
}

/**
 * Parse query parameters into BusinessEntryFilters
 */
function parseFilters(params: URLSearchParams): BusinessEntryFilters {
  const filters: BusinessEntryFilters = {};

  const employeeId = params.get('employeeId');
  if (employeeId) filters.employeeId = parseInt(employeeId);

  const month = params.get('month');
  if (month) filters.month = month;

  const productId = params.get('productId');
  if (productId) filters.productId = parseInt(productId);

  const startDate = params.get('startDate');
  if (startDate) filters.startDate = startDate;

  const endDate = params.get('endDate');
  if (endDate) filters.endDate = endDate;

  const status = params.get('status');
  if (status) filters.status = status;

  const minAmount = params.get('minAmount');
  if (minAmount) filters.minAmount = parseFloat(minAmount);

  const maxAmount = params.get('maxAmount');
  if (maxAmount) filters.maxAmount = parseFloat(maxAmount);

  const productCategory = params.get('productCategory');
  if (productCategory) filters.productCategory = productCategory;

  const isCrossSale = params.get('isCrossSale');
  if (isCrossSale !== null) filters.isCrossSale = isCrossSale === 'true';

  const isBusinessLoss = params.get('isBusinessLoss');
  if (isBusinessLoss !== null) filters.isBusinessLoss = isBusinessLoss === 'true';

  const entityFilter = params.get('entityFilter');
  if (entityFilter) filters.entityFilter = entityFilter;

  return filters;
}

/**
 * GET /api/mis/business-entries
 * RM: returns own entries for current/specified month
 * Admin: can pass all filter query params + ?analytics=true for summary
 *
 * Query params:
 *   ?month=YYYY-MM
 *   ?employeeId=X               (admin only)
 *   ?startDate=YYYY-MM-DD       (filter by transactionDate)
 *   ?endDate=YYYY-MM-DD         (filter by transactionDate, max 60 days from startDate)
 *   ?status=draft|submitted|approved|rejected|error|all
 *   ?minAmount=10000             (premium range min)
 *   ?maxAmount=100000            (premium range max)
 *   ?productCategory=Life|Health|GI Motor|GI Non-Motor|MF
 *   ?isCrossSale=true
 *   ?isBusinessLoss=true
 *   ?entityFilter=TAS|TIB
 *   ?productId=X
 *   ?analytics=true              (returns analytics summary instead of raw entries)
 */
export async function GET(request: NextRequest) {
  try {
    // Try RM auth first, then admin auth
    let employeeId: number | undefined;
    let isAdmin = false;

    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(COOKIE_NAME)?.value;
    const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;

    if (rmToken) {
      const user = await verifyRMToken(rmToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
    } else if (adminToken) {
      const user = await verifyToken(adminToken);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      isAdmin = user.role === 'admin';
    } else if (empToken) {
      const user = await verifyEmployeeToken(empToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    // Validate date range
    const dateError = validateDateRange(
      params.get('startDate') || undefined,
      params.get('endDate') || undefined
    );
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const wantsAnalytics = params.get('analytics') === 'true';

    if (isAdmin) {
      // Admin can use all filter params
      const filters = parseFilters(params);

      if (wantsAnalytics) {
        const analytics = await getBusinessAnalytics(filters);
        return NextResponse.json({ analytics });
      }

      const entries = await getBusinessEntries(filters);
      return NextResponse.json({ entries, count: entries.length });
    }

    // RM: own entries only — apply filters but force employeeId
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID not found' }, { status: 400 });
    }

    const month = params.get('month') || undefined;

    // For RM, support limited filtering on their own entries
    const filters = parseFilters(params);
    filters.employeeId = employeeId; // Always force own entries

    if (!filters.month && !filters.startDate) {
      // Default to current month if no date filters provided
      filters.month = month || undefined;
    }

    if (wantsAnalytics) {
      const analytics = await getBusinessAnalytics(filters);
      return NextResponse.json({ analytics });
    }

    const entries = await getBusinessEntries(filters);
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
    const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;

    if (rmToken) {
      const user = await verifyRMToken(rmToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
      userName = user.employeeCode;
    } else if (adminToken) {
      const user = await verifyToken(adminToken);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userName = user.email;
    } else if (empToken) {
      const user = await verifyEmployeeToken(empToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
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
        transactionDate: body.transactionDate,
        isCrossSale: body.isCrossSale,
        isBusinessLoss: body.isBusinessLoss,
        lossReason: body.lossReason,
      },
      userName
    );

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Business entry POST error');
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
