import { NextRequest, NextResponse } from 'next/server';
import {
  getReportEntry,
  updateReportEntry,
  getReportPlanningData,
  saveReportPlanningData,
  updateReportPdf,
} from '@/lib/admin/report-queue-store';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { generateFullReport } from '@/lib/utils/financial-planning-calc';
import { buildExecutiveSummary } from '@/lib/utils/claude-narrative';
import type { EditHistoryEntry } from '@/types/report-queue';
import type { FinancialPlanningData, FinancialHealthReport } from '@/types/financial-planning';

// Comprehensive PDF rendering can take 15-20s on Vercel's serverless runtime.
// Combined with blob writes, we need more headroom than the default 30s.
export const maxDuration = 60;

/**
 * What-if scenario endpoint.
 *
 *   POST  /api/admin/reports/[id]/scenario
 *
 * Body:
 *   {
 *     overrides:  Partial<ScenarioOverrides>,   // see ScenarioOverrides below
 *     mode:       'preview' | 'replace'
 *   }
 *
 *   - 'preview' → recalculate metrics on-the-fly without saving. Used by the
 *                 admin UI for the live what-if slider experience.
 *   - 'replace' → persist the overrides into planningData blob, regenerate
 *                 the AI narrative + PDF. Equivalent to a one-click "apply
 *                 these new inputs without re-doing the 30-minute wizard".
 */

/** The fields the admin/client can tweak from the report detail page. */
interface ScenarioOverrides {
  // Income & cashflow
  monthlyInHandSalary?: number;
  annualBonus?: number;
  monthlyHouseholdExpenses?: number;
  annualDiscretionary?: number;
  monthlyEMIs?: number;
  monthlySIPsRunning?: number;
  monthlyInsurancePremiums?: number;

  // Personal
  retirementAge?: number;

  // Insurance
  termInsuranceCover?: number;
  healthInsuranceCover?: number;

  // Goals — keyed by goal id; each can edit targetAmount, targetYear, currentSavingsForGoal,
  // costType (whether target is in today's prices or already a future budget), and an
  // optional customInflationRate applied only when costType === 'present'.
  goals?: Record<
    string,
    {
      targetAmount?: number;
      targetYear?: number;
      currentSavingsForGoal?: number;
      costType?: 'present' | 'future';
      customInflationRate?: number;
    }
  >;
}

function applyOverrides(
  data: FinancialPlanningData,
  overrides: ScenarioOverrides,
): FinancialPlanningData {
  // Deep-clone to avoid mutating the original
  const next: FinancialPlanningData = JSON.parse(JSON.stringify(data));

  // Income / cashflow
  if (overrides.monthlyInHandSalary !== undefined) {
    next.incomeProfile.monthlyInHandSalary = overrides.monthlyInHandSalary;
  }
  if (overrides.annualBonus !== undefined) {
    next.incomeProfile.annualBonus = overrides.annualBonus;
  }
  if (overrides.monthlyHouseholdExpenses !== undefined) {
    next.incomeProfile.monthlyHouseholdExpenses = overrides.monthlyHouseholdExpenses;
  }
  if (overrides.annualDiscretionary !== undefined) {
    next.incomeProfile.annualDiscretionary = overrides.annualDiscretionary;
  }
  if (overrides.monthlyEMIs !== undefined) {
    next.incomeProfile.monthlyEMIs = overrides.monthlyEMIs;
  }
  if (overrides.monthlySIPsRunning !== undefined) {
    next.incomeProfile.monthlySIPsRunning = overrides.monthlySIPsRunning;
  }
  if (overrides.monthlyInsurancePremiums !== undefined) {
    next.incomeProfile.monthlyInsurancePremiums = overrides.monthlyInsurancePremiums;
  }

  // Personal
  if (overrides.retirementAge !== undefined && next.careerProfile) {
    // retirementAge lives on careerProfile (or personalProfile) — handle both
    const cp = next.careerProfile as unknown as Record<string, number>;
    if ('retirementAge' in cp) cp.retirementAge = overrides.retirementAge;
    const pp = next.personalProfile as unknown as Record<string, number>;
    if ('retirementAge' in pp) pp.retirementAge = overrides.retirementAge;
  }

  // Insurance
  if (overrides.termInsuranceCover !== undefined) {
    next.insuranceProfile.termInsuranceCover = overrides.termInsuranceCover;
  }
  if (overrides.healthInsuranceCover !== undefined) {
    next.insuranceProfile.healthInsuranceCover = overrides.healthInsuranceCover;
  }

  // Goals — keyed by goal id OR goal name (fallback)
  type GoalLike = {
    id?: string;
    name?: string;
    targetAmount: number;
    targetYear: number;
    currentSavingsForGoal?: number;
    costType?: 'present' | 'future';
    customInflationRate?: number;
  };
  const goalsAny = (next as unknown as { goals?: GoalLike[] }).goals;
  if (overrides.goals && Array.isArray(goalsAny)) {
    for (const g of goalsAny) {
      const key = g.id || g.name || '';
      const o = overrides.goals[key];
      if (!o) continue;
      if (o.targetAmount !== undefined) g.targetAmount = o.targetAmount;
      if (o.targetYear !== undefined) g.targetYear = o.targetYear;
      if (o.currentSavingsForGoal !== undefined) g.currentSavingsForGoal = o.currentSavingsForGoal;
      if (o.costType !== undefined) g.costType = o.costType;
      if (o.customInflationRate !== undefined) g.customInflationRate = o.customInflationRate;
    }
  }

  return next;
}

/** Compact summary metrics returned for the live preview UI. */
interface ScenarioPreview {
  healthScore: number;
  grade: string;
  netWorth: number;
  retirementCorpusRequired: number;
  retirementCurrentProgress: number;
  retirementGap: number;
  retirementReadinessPct: number;
  totalGoalMonthlySIP: number;
  goalFeasibility: { id: string; name: string; futureCost: number; monthlyRequired: number; feasibility: string }[];
  estimatedYear1Surplus: number;
  pillars: { cashflow: number; protection: number; investments: number; debt: number; retirementReadiness: number };
}

function buildPreview(data: FinancialPlanningData): ScenarioPreview {
  const r = generateFullReport(data);

  // Approximate Year-1 surplus (matches PDF page-7 fallback formula)
  const inc = data.incomeProfile;
  const baseIncome =
    (inc.monthlyInHandSalary || 0) * 12 +
    (inc.annualBonus || 0) +
    (inc.rentalIncome || 0) * 12 +
    (inc.businessIncome || 0) * 12 +
    (inc.otherIncome || 0) * 12;
  const baseExpenses = (inc.monthlyHouseholdExpenses || 0) * 12 + (inc.annualDiscretionary || 0);
  const baseEMIs = (inc.monthlyEMIs || 0) * 12;
  const basePremiums = (inc.monthlyInsurancePremiums || 0) * 12;
  const baseSIPs = (inc.monthlySIPsRunning || 0) * 12;
  const estimatedYear1Surplus = baseIncome - baseExpenses - baseEMIs - basePremiums - baseSIPs;

  const required = r.retirementGap?.requiredCorpus || 0;
  const progress = r.retirementGap?.currentProgress || 0;
  const readinessPct = required > 0 ? Math.round((progress / required) * 100) : 0;

  return {
    healthScore: r.score?.totalScore || 0,
    grade: r.score?.grade || '—',
    netWorth: r.netWorth?.netWorth || 0,
    retirementCorpusRequired: required,
    retirementCurrentProgress: progress,
    retirementGap: r.retirementGap?.gap || 0,
    retirementReadinessPct: readinessPct,
    totalGoalMonthlySIP: (r.goalGaps || []).reduce((s, g) => s + (g.monthlyRequired || 0), 0),
    goalFeasibility: (r.goalGaps || []).map((g, idx) => ({
      id: `g-${idx}`,
      name: g.goalName,
      futureCost: g.futureCost,
      monthlyRequired: g.monthlyRequired,
      feasibility: g.feasibility,
    })),
    estimatedYear1Surplus,
    pillars: {
      cashflow: r.score?.pillars?.cashflow?.score || 0,
      protection: r.score?.pillars?.protection?.score || 0,
      investments: r.score?.pillars?.investments?.score || 0,
      debt: r.score?.pillars?.debt?.score || 0,
      retirementReadiness: r.score?.pillars?.retirementReadiness?.score || 0,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const overrides: ScenarioOverrides = body?.overrides || {};
    const mode: 'preview' | 'replace' = body?.mode === 'replace' ? 'replace' : 'preview';
    const adminEmail = request.headers.get('x-admin-email') || 'unknown';

    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (entry.status === 'sent' && mode === 'replace') {
      return NextResponse.json({ error: 'Cannot edit a report already sent to client' }, { status: 409 });
    }

    const planningData = await getReportPlanningData(id);
    if (!planningData) {
      return NextResponse.json({ error: 'Planning data not found' }, { status: 500 });
    }

    const next = applyOverrides(planningData, overrides);
    const baseline = buildPreview(planningData);
    const preview = buildPreview(next);

    if (mode === 'preview') {
      return NextResponse.json({ ok: true, mode, baseline, preview });
    }

    // ─── mode === 'replace' → persist + regenerate ─────────────────────────
    // We deliberately SKIP regenerating the Claude narrative on a what-if
    // apply. The narrative is slow (5-15s API call) and unnecessary for
    // scenario iteration — the admin/client is tweaking numbers, not the
    // Trustner team's prose. Use the existing narrative (or fallback) and just
    // re-render the PDF with the new numbers. This keeps Apply under 10s.
    const t0 = Date.now();
    console.log(`[Scenario] mode=replace tier=${entry.tier || 'basic'} reportId=${id}`);

    try {
      await saveReportPlanningData(id, next);
      console.log(`[Scenario] saveReportPlanningData done in ${Date.now() - t0}ms`);
    } catch (e) {
      console.error('[Scenario] saveReportPlanningData failed:', e);
      return NextResponse.json({ error: 'Failed to save planning data' }, { status: 500 });
    }

    let baseReport;
    try {
      baseReport = generateFullReport(next);
      console.log(`[Scenario] generateFullReport done @ ${Date.now() - t0}ms — score=${baseReport.score?.totalScore}`);
    } catch (e) {
      console.error('[Scenario] generateFullReport failed:', e);
      return NextResponse.json({ error: 'Recalculation failed' }, { status: 500 });
    }

    // Reuse the existing narrative — fall back to a minimal placeholder if
    // none exists yet on the report entry. (Narrative is goal-agnostic enough
    // that re-running Claude on every scenario apply isn't worth the 4-8s.)
    const reusedNarrative =
      entry.editedNarrative ||
      entry.claudeNarrative ||
      'Updated financial health summary based on revised inputs.';

    // BUT: regenerate the Executive Summary every time, because it's goal-
    // specific — goal targets, horizons, costType all change in a scenario
    // apply, so the per-goal recommendations must refresh to match.
    // Comprehensive tier only; runs in ~3-5s on average.
    let executiveSummary;
    if ((entry.tier || 'basic') === 'comprehensive') {
      try {
        executiveSummary = await buildExecutiveSummary(baseReport, next, entry.userName);
        console.log(`[Scenario] buildExecutiveSummary done @ ${Date.now() - t0}ms — items=${executiveSummary?.items?.length || 0}`);
      } catch (e) {
        console.error('[Scenario] buildExecutiveSummary failed (continuing without):', e);
      }
    }

    // Pick the most recent executive summary available:
    // 1. The one we just regenerated (best — reflects new goal numbers)
    // 2. The one persisted on the entry from a previous regenerate
    // 3. undefined — PDF renderer falls back to its built-in table
    const effectiveExecSummary = executiveSummary
      || (entry as unknown as { executiveSummary?: unknown }).executiveSummary;

    const fullReport: FinancialHealthReport = {
      ...baseReport,
      claudeNarrative: reusedNarrative,
      ...(effectiveExecSummary ? { executiveSummary: effectiveExecSummary } : {}),
    } as FinancialHealthReport;

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = generateFinancialReport(fullReport, next, entry.userName, entry.tier || 'basic');
      console.log(`[Scenario] generateFinancialReport done @ ${Date.now() - t0}ms — pdf=${(pdfBuffer.length / 1024).toFixed(0)}KB`);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const errStack = e instanceof Error ? e.stack : '';
      console.error('[Scenario] generateFinancialReport failed:', errMsg, errStack);
      // Surface the underlying error to the client for now so admin sees the actual cause
      return NextResponse.json({
        error: 'PDF rendering failed',
        detail: errMsg,
        stack: errStack?.split('\n').slice(0, 6).join('\n'),
      }, { status: 500 });
    }

    let newPdfUrl: string;
    const nextVersion = entry.narrativeVersion + 1;
    try {
      newPdfUrl = await updateReportPdf(id, pdfBuffer, `v${nextVersion}-${Date.now()}`);
      console.log(`[Scenario] updateReportPdf done @ ${Date.now() - t0}ms url=${newPdfUrl}`);
    } catch (e) {
      console.error('[Scenario] updateReportPdf failed:', e);
      return NextResponse.json({ error: 'PDF upload failed' }, { status: 500 });
    }

    const historyEntry: EditHistoryEntry = {
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'narrative_regenerated',
      details: `Scenario applied — Score ${baseline.healthScore} → ${preview.healthScore}, NW ${Math.round(baseline.netWorth / 100000)}L → ${Math.round(preview.netWorth / 100000)}L`,
    };

    try {
      await updateReportEntry(id, {
        narrativeVersion: entry.narrativeVersion + 1,
        pdfBlobUrl: newPdfUrl,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        editHistory: [...entry.editHistory, historyEntry],
        // Reflect the recalculated score and grade on the queue entry so the
        // admin sidebar updates immediately after Apply (the pillar bars and
        // headline score in the UI read from this, not from inside the PDF).
        totalScore: baseReport.score?.totalScore ?? entry.totalScore,
        grade: baseReport.score?.grade ?? entry.grade,
        // Persist the refreshed executive summary so subsequent page-loads
        // and PDF re-renders keep the bespoke per-goal narrative table.
        ...(executiveSummary ? { executiveSummary } : {}),
      });
      console.log(`[Scenario] updateReportEntry done @ ${Date.now() - t0}ms — version=${entry.narrativeVersion + 1} score=${baseReport.score?.totalScore}`);
    } catch (e) {
      console.error('[Scenario] updateReportEntry failed:', e);
      return NextResponse.json({ error: 'Report metadata update failed' }, { status: 500 });
    }

    console.log(`[Scenario] mode=replace COMPLETE in ${Date.now() - t0}ms`);
    return NextResponse.json({
      ok: true,
      mode,
      baseline,
      preview,
      pdfUrl: newPdfUrl,
      narrativeVersion: entry.narrativeVersion + 1,
    });
  } catch (error) {
    console.error('[Scenario] Uncaught:', error);
    return NextResponse.json({ error: 'Scenario calculation failed' }, { status: 500 });
  }
}
