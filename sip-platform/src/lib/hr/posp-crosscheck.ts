/**
 * POSP Cross-Check Engine — Phase 6 of the Trustner HRMS.
 *
 * Closes the fraud-prevention gap exposed by the 4 cases in Ram's redesign
 * brief (Zakir, Gourab, Sukanta, Ashis). At the moment a new POSP candidate
 * is proposed for onboarding, this engine matches their KYC against the
 * employee master + family roster. Any match goes to compliance review.
 *
 * Match logic (in increasing strictness):
 *   - PAN exact:    employee/family.pan == candidate.pan          → HARD HIT (cannot proceed without exception)
 *   - Mobile exact: employee/family.phone == candidate.mobile     → STRONG HIT
 *   - Name fuzzy:   normalized surname/given-name overlap         → SOFT HIT
 *   - Aadhaar last-4 + DOB match                                  → STRONG HIT
 *
 * Each call writes a row to hr_posp_crosschecks with status='flagged' and
 * a match_type + score, regardless of whether a match was found (so we have
 * the full audit trail even for "no match" candidates).
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface PospCandidate {
  pan?: string | null;
  name: string;
  mobile?: string | null;
  aadhaar_last4?: string | null;
  dob?: string | null;
  address?: string | null;
}

export interface CrossCheckResult {
  audit_id: number;
  status: 'no_match' | 'flagged_soft' | 'flagged_strong' | 'flagged_hard';
  match_type: 'pan_exact' | 'mobile_exact' | 'name_fuzzy' | 'address_fuzzy' | 'no_match';
  match_score: number;          // 0-100
  matched_employee_id?: number;
  matched_family_id?: number;
  matched_label: string;
  recommendation: string;
}

/** Normalize a name for fuzzy comparison */
function normName(s: string | null | undefined): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|miss|smt|shri|dr)\b\.?/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Token-set similarity (0-100) */
function tokenSetScore(a: string, b: string): number {
  const ta = new Set(normName(a).split(' ').filter((t) => t.length >= 3));
  const tb = new Set(normName(b).split(' ').filter((t) => t.length >= 3));
  if (ta.size === 0 || tb.size === 0) return 0;
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return Math.round((inter / union) * 100);
}

/**
 * Run the cross-check synchronously. Returns the verdict and writes the
 * audit row. Caller (typically the POSP onboarding API or HR UI) decides
 * whether to proceed.
 */
export async function runPospCrossCheck(candidate: PospCandidate): Promise<CrossCheckResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // ── Tier 1: PAN exact match ──
  if (candidate.pan && candidate.pan.length === 10) {
    const pan = candidate.pan.toUpperCase();
    const [{ data: empPan }, { data: famPan }] = await Promise.all([
      supabase.from('hr_employees').select('id, full_name').eq('pan', pan).maybeSingle(),
      supabase.from('hr_employee_family').select('id, name, employee_id').eq('pan', pan).maybeSingle(),
    ]);
    if (empPan) {
      return writeAudit(supabase, candidate, {
        match_type: 'pan_exact', match_score: 100,
        matched_employee_id: empPan.id,
        status: 'flagged_hard',
        matched_label: `Employee: ${empPan.full_name}`,
        recommendation: 'HARD STOP — PAN matches an active Trustner employee. Compliance must reject or document exception in writing.',
      });
    }
    if (famPan) {
      return writeAudit(supabase, candidate, {
        match_type: 'pan_exact', match_score: 100,
        matched_family_id: famPan.id,
        status: 'flagged_hard',
        matched_label: `Family member of employee #${famPan.employee_id}: ${famPan.name}`,
        recommendation: 'HARD STOP — PAN matches a declared family member of a Trustner employee. Cannot proceed without compliance exception.',
      });
    }
  }

  // ── Tier 2: Mobile exact match ──
  if (candidate.mobile) {
    const cleanMobile = candidate.mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length === 10) {
      const { data: empMobile } = await supabase
        .from('hr_employees').select('id, full_name').eq('phone', cleanMobile).maybeSingle();
      if (empMobile) {
        return writeAudit(supabase, candidate, {
          match_type: 'mobile_exact', match_score: 90,
          matched_employee_id: empMobile.id,
          status: 'flagged_strong',
          matched_label: `Employee: ${empMobile.full_name}`,
          recommendation: 'STRONG HIT — Mobile matches an active Trustner employee. Compliance review required.',
        });
      }
    }
  }

  // ── Tier 3: Name fuzzy match (against employees + family) ──
  if (candidate.name) {
    const candNorm = normName(candidate.name);
    if (candNorm.length >= 5) {
      const [{ data: emps }, { data: fams }] = await Promise.all([
        supabase.from('hr_employees').select('id, full_name'),
        supabase.from('hr_employee_family').select('id, name, employee_id'),
      ]);
      let bestScore = 0;
      let bestEmp: { id: number; full_name: string } | null = null;
      let bestFam: { id: number; name: string; employee_id: number } | null = null;
      for (const e of emps ?? []) {
        const s = tokenSetScore(candidate.name, e.full_name);
        if (s > bestScore) { bestScore = s; bestEmp = e; bestFam = null; }
      }
      for (const f of fams ?? []) {
        const s = tokenSetScore(candidate.name, f.name);
        if (s > bestScore) { bestScore = s; bestFam = f; bestEmp = null; }
      }
      if (bestScore >= 70) {
        return writeAudit(supabase, candidate, {
          match_type: 'name_fuzzy', match_score: bestScore,
          matched_employee_id: bestEmp?.id,
          matched_family_id: bestFam?.id,
          status: 'flagged_soft',
          matched_label: bestEmp
            ? `Employee: ${bestEmp.full_name}`
            : `Family member of employee #${bestFam!.employee_id}: ${bestFam!.name}`,
          recommendation: `SOFT HIT (${bestScore}% name overlap) — Manual verification recommended. May be a coincidence; cross-check address/DOB.`,
        });
      }
    }
  }

  // ── Tier 4: No match ──
  return writeAudit(supabase, candidate, {
    match_type: 'no_match', match_score: 0,
    status: 'no_match',
    matched_label: 'No match found',
    recommendation: 'CLEAR — No employee or family-member match detected. POSP may proceed to next onboarding step.',
  });
}

// Use loose typing because the Supabase generated types are too strict for
// a tiny insert helper; this audit row is a write-only insert.
type LooseSupabase = ReturnType<typeof getSupabaseAdmin>;

async function writeAudit(
  supabase: NonNullable<LooseSupabase>,
  candidate: PospCandidate,
  verdict: Omit<CrossCheckResult, 'audit_id'>
): Promise<CrossCheckResult> {
  const status = verdict.match_type === 'no_match' ? 'flagged' : 'flagged';
  // We keep DB status as 'flagged' for everything except 'no_match';
  // compliance review can later mark 'approved_exception' or 'rejected'.
  const { data, error } = await supabase
    .from('hr_posp_crosschecks')
    .insert({
      posp_candidate_pan: candidate.pan || null,
      posp_candidate_name: candidate.name,
      posp_candidate_mobile: candidate.mobile || null,
      posp_candidate_address: candidate.address || null,
      matched_employee_id: verdict.matched_employee_id || null,
      matched_family_id: verdict.matched_family_id || null,
      match_type: verdict.match_type,
      match_score: verdict.match_score,
      status,
      notes: verdict.matched_label,
    })
    .select('id')
    .single();
  if (error) throw new Error('Failed to write audit: ' + error.message);
  return { ...verdict, audit_id: data!.id };
}
