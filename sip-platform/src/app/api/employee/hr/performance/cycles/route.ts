/**
 * Phase 9 — Performance / Appraisal cycles.
 *
 * GET  /api/employee/hr/performance/cycles
 *   HR-admin lists all cycles (newest first). Query params:
 *     - status, fiscal_year, cycle_type
 *     - page (default 1), page_size (default 50, max 200)
 *
 * POST /api/employee/hr/performance/cycles
 *   HR-admin creates a new cycle in 'draft' state.
 *   Body:
 *     {
 *       fiscal_year,            // 'FY26' (auto-derived from start_date if omitted)
 *       cycle_type,             // 'annual' | 'mid_year' | 'probation_confirmation'
 *       start_date, end_date,
 *       goals_due_date?, midyear_due_date?,
 *       self_review_due_date?, manager_review_due_date?,
 *       skip_review_due_date?, calibration_due_date?,
 *       enforce_distribution?,  // default false
 *       distribution_curve?     // JSON, default standard 5/15/60/15/5
 *     }
 *
 *   cycle_code auto-generated: CYC-<FY>-<TYPE_SHORT>-<seq>
 *     e.g. CYC-FY26-ANN-001
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin, fyFromDate } from '@/lib/hr/performance/route-auth';
import type { CycleType } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const VALID_CYCLE_TYPES: CycleType[] = ['annual', 'mid_year', 'probation_confirmation'];

function cycleTypeShort(t: CycleType): string {
  if (t === 'annual') return 'ANN';
  if (t === 'mid_year') return 'MID';
  return 'PROBC';
}

export async function GET(req: NextRequest) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const fiscal_year = url.searchParams.get('fiscal_year');
  const cycle_type = url.searchParams.get('cycle_type');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const page_size = Math.min(200, Math.max(1, Number(url.searchParams.get('page_size') ?? '50')));
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = supabase
    .from('hr_appraisal_cycle')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (fiscal_year) query = query.eq('fiscal_year', fiscal_year);
  if (cycle_type) query = query.eq('cycle_type', cycle_type);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    rows: data ?? [],
    page,
    page_size,
    total: count ?? (data?.length ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const {
    fiscal_year,
    cycle_type,
    start_date,
    end_date,
    goals_due_date,
    midyear_due_date,
    self_review_due_date,
    manager_review_due_date,
    skip_review_due_date,
    calibration_due_date,
    enforce_distribution,
    distribution_curve,
  } = body as {
    fiscal_year?: string;
    cycle_type?: CycleType;
    start_date?: string;
    end_date?: string;
    goals_due_date?: string;
    midyear_due_date?: string;
    self_review_due_date?: string;
    manager_review_due_date?: string;
    skip_review_due_date?: string;
    calibration_due_date?: string;
    enforce_distribution?: boolean;
    distribution_curve?: Record<string, number>;
  };

  if (!start_date || !end_date || !cycle_type) {
    return NextResponse.json(
      { error: 'cycle_type, start_date, end_date required' },
      { status: 400 },
    );
  }
  if (!VALID_CYCLE_TYPES.includes(cycle_type)) {
    return NextResponse.json(
      { error: `cycle_type must be one of ${VALID_CYCLE_TYPES.join(', ')}` },
      { status: 400 },
    );
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 });
  }

  const fy = (fiscal_year ?? fyFromDate(start_date)).toUpperCase();
  const typeShort = cycleTypeShort(cycle_type);

  // Generate cycle_code = CYC-<FY>-<TYPE>-<seq> by counting existing same-prefix codes
  const codePrefix = `CYC-${fy}-${typeShort}`;
  const { count: existingCount } = await supabase
    .from('hr_appraisal_cycle')
    .select('id', { count: 'exact', head: true })
    .like('cycle_code', `${codePrefix}-%`);

  const seq = String((existingCount ?? 0) + 1).padStart(3, '0');
  const cycle_code = `${codePrefix}-${seq}`;

  const insertRow = {
    cycle_code,
    fiscal_year: fy,
    cycle_type,
    start_date,
    end_date,
    status: 'draft' as const,
    enforce_distribution: enforce_distribution ?? false,
    distribution_curve: distribution_curve ?? null,
    goals_due_date: goals_due_date ?? null,
    midyear_due_date: midyear_due_date ?? null,
    self_review_due_date: self_review_due_date ?? null,
    manager_review_due_date: manager_review_due_date ?? null,
    skip_review_due_date: skip_review_due_date ?? null,
    calibration_due_date: calibration_due_date ?? null,
    created_by: g.ctx.email,
  };

  const { data, error } = await supabase
    .from('hr_appraisal_cycle')
    .insert(insertRow)
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `cycle_code ${cycle_code} already exists (race). Retry.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ row: data, cycle_code });
}
