/**
 * POST /api/employee/hr/performance/calibration
 *
 * HR-admin batch calibration. For each entry, writes (or upserts) the
 * hr_rating row for (cycle_id, employee_id):
 *   - final_performance_rating (1..5)
 *   - final_potential_rating (1..5, optional)
 *   - nine_box_quadrant (derived via mapNineBox)
 *   - compliance_capped + compliance_cap_reason (re-evaluated)
 *
 * Body:
 *   {
 *     cycle_id,
 *     enforce_distribution?: boolean,   // if true, check against cycle's curve
 *     ratings: [
 *       {
 *         employee_id,
 *         final_performance_rating,
 *         final_potential_rating?,
 *         recommended_increment_pct?
 *       }
 *     ]
 *   }
 *
 * Returns per-row outcome + distribution summary.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { requireAdmin } from '@/lib/hr/performance/route-auth';
import {
  mapNineBox,
  computeComplianceCap,
  applyCap,
  type CycleWindow,
} from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface RatingEntry {
  employee_id: number;
  final_performance_rating: number;
  final_potential_rating?: number | null;
  recommended_increment_pct?: number | null;
}

export async function POST(req: NextRequest) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { cycle_id, enforce_distribution, ratings } = body as {
    cycle_id?: number;
    enforce_distribution?: boolean;
    ratings?: RatingEntry[];
  };
  if (!cycle_id || !Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: 'cycle_id + ratings[] required' }, { status: 400 });
  }

  const { data: cycle } = await supabase
    .from('hr_appraisal_cycle')
    .select('id, status, start_date, end_date, enforce_distribution, distribution_curve')
    .eq('id', cycle_id)
    .single();
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  if (cycle.status !== 'calibration' && cycle.status !== 'skip_review_open') {
    return NextResponse.json(
      {
        error: `Calibration requires cycle.status='calibration' (current: ${cycle.status})`,
      },
      { status: 422 },
    );
  }

  const window: CycleWindow = {
    cycle_id,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
  };

  const results: Array<{
    employee_id: number;
    rating_id: number | null;
    final_performance_rating: number;
    final_potential_rating: number | null;
    nine_box_quadrant: string | null;
    compliance_capped: boolean;
    compliance_cap_reason: string | null;
    error?: string;
  }> = [];

  for (const r of ratings) {
    if (
      !r.employee_id ||
      typeof r.final_performance_rating !== 'number' ||
      r.final_performance_rating < 1 ||
      r.final_performance_rating > 5
    ) {
      results.push({
        employee_id: r.employee_id,
        rating_id: null,
        final_performance_rating: r.final_performance_rating,
        final_potential_rating: r.final_potential_rating ?? null,
        nine_box_quadrant: null,
        compliance_capped: false,
        compliance_cap_reason: null,
        error: 'final_performance_rating must be 1..5',
      });
      continue;
    }
    if (
      r.final_potential_rating != null &&
      (r.final_potential_rating < 1 || r.final_potential_rating > 5)
    ) {
      results.push({
        employee_id: r.employee_id,
        rating_id: null,
        final_performance_rating: r.final_performance_rating,
        final_potential_rating: r.final_potential_rating,
        nine_box_quadrant: null,
        compliance_capped: false,
        compliance_cap_reason: null,
        error: 'final_potential_rating must be 1..5',
      });
      continue;
    }

    const cap = await computeComplianceCap(r.employee_id, window);
    const cappedPerf = applyCap(r.final_performance_rating, cap);
    const quadrant = r.final_potential_rating
      ? mapNineBox(cappedPerf, r.final_potential_rating)
      : null;

    const payload = {
      cycle_id,
      employee_id: r.employee_id,
      final_performance_rating: cappedPerf,
      final_potential_rating: r.final_potential_rating ?? null,
      nine_box_quadrant: quadrant,
      compliance_capped: cap.capped,
      compliance_cap_reason: cap.capped ? cap.reason.join('; ') : null,
      recommended_increment_pct: r.recommended_increment_pct ?? null,
      pip_required: cappedPerf === 1,
    };

    const { data: existing } = await supabase
      .from('hr_rating')
      .select('id, locked')
      .eq('cycle_id', cycle_id)
      .eq('employee_id', r.employee_id)
      .maybeSingle();

    let outRow;
    if (existing) {
      if (existing.locked) {
        results.push({
          employee_id: r.employee_id,
          rating_id: existing.id,
          final_performance_rating: cappedPerf,
          final_potential_rating: r.final_potential_rating ?? null,
          nine_box_quadrant: quadrant,
          compliance_capped: cap.capped,
          compliance_cap_reason: payload.compliance_cap_reason,
          error: 'Rating is locked — use finalize endpoint to override',
        });
        continue;
      }
      const { data, error } = await supabase
        .from('hr_rating')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) {
        console.error(error.message);
        results.push({
          employee_id: r.employee_id,
          rating_id: existing.id,
          final_performance_rating: cappedPerf,
          final_potential_rating: r.final_potential_rating ?? null,
          nine_box_quadrant: quadrant,
          compliance_capped: cap.capped,
          compliance_cap_reason: payload.compliance_cap_reason,
          error: 'Internal error',
        });
        continue;
      }
      outRow = data;
    } else {
      const { data, error } = await supabase
        .from('hr_rating')
        .insert(payload)
        .select('*')
        .single();
      if (error) {
        console.error(error.message);
        results.push({
          employee_id: r.employee_id,
          rating_id: null,
          final_performance_rating: cappedPerf,
          final_potential_rating: r.final_potential_rating ?? null,
          nine_box_quadrant: quadrant,
          compliance_capped: cap.capped,
          compliance_cap_reason: payload.compliance_cap_reason,
          error: 'Internal error',
        });
        continue;
      }
      outRow = data;
    }
    results.push({
      employee_id: r.employee_id,
      rating_id: outRow.id,
      final_performance_rating: cappedPerf,
      final_potential_rating: r.final_potential_rating ?? null,
      nine_box_quadrant: quadrant,
      compliance_capped: cap.capped,
      compliance_cap_reason: payload.compliance_cap_reason,
    });
  }

  // Distribution summary
  const distribution = new Map<number, number>();
  for (const r of results) {
    if (r.error) continue;
    distribution.set(
      r.final_performance_rating,
      (distribution.get(r.final_performance_rating) ?? 0) + 1,
    );
  }
  const total = Array.from(distribution.values()).reduce((s, v) => s + v, 0);
  const pctMap: Record<string, number> = {};
  for (const [rating, count] of distribution.entries()) {
    pctMap[String(rating)] =
      total === 0 ? 0 : Math.round((count / total) * 10000) / 100;
  }

  let distribution_violations: string[] | null = null;
  const enforceFlag = enforce_distribution ?? cycle.enforce_distribution ?? false;
  if (enforceFlag) {
    const curve =
      (cycle.distribution_curve as Record<string, number> | null) ?? null;
    if (curve) {
      const tolerance = 5; // ± 5% per bucket
      distribution_violations = [];
      for (const [bucket, expected] of Object.entries(curve)) {
        const actual = pctMap[bucket] ?? 0;
        if (Math.abs(actual - expected) > tolerance) {
          distribution_violations.push(
            `Bucket ${bucket}: expected ${expected}% ± ${tolerance}, actual ${actual}%`,
          );
        }
      }
    }
  }

  return NextResponse.json({
    cycle_id,
    results,
    distribution: pctMap,
    distribution_violations,
  });
}
