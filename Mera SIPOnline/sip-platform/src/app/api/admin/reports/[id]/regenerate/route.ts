import { NextRequest, NextResponse } from 'next/server';
import {
  getReportEntry,
  updateReportEntry,
  getReportPlanningData,
  updateReportPdf,
} from '@/lib/admin/report-queue-store';
import { generateClaudeNarrative, buildExecutiveSummary } from '@/lib/utils/claude-narrative';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { generateFullReport } from '@/lib/utils/financial-planning-calc';
import type { EditHistoryEntry, PlanTierLabel } from '@/types/report-queue';
import type { FinancialHealthReport } from '@/types/financial-planning';

// The new comprehensive pipeline runs TWO Claude calls in parallel
// (narrative + executive summary) plus the 17-page PDF render. Total wall
// time is typically 18-35s on cold start, so we need more headroom than
// Vercel's default 30s cap.
export const maxDuration = 60;

const TIER_ORDER: PlanTierLabel[] = ['basic', 'standard', 'comprehensive'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminEmail = request.headers.get('x-admin-email') || 'unknown';

    // Parse optional targetTier from request body
    let targetTier: PlanTierLabel | undefined;
    try {
      const body = await request.json();
      targetTier = body?.targetTier;
    } catch {
      // Body may be empty for legacy calls (just regenerate at same tier)
    }

    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (entry.status === 'sent') {
      return NextResponse.json({ error: 'Cannot regenerate — report already sent' }, { status: 409 });
    }

    // Validate tier upgrade path if targetTier is provided
    const currentTier = entry.tier || 'basic';
    if (targetTier) {
      const currentIdx = TIER_ORDER.indexOf(currentTier);
      const targetIdx = TIER_ORDER.indexOf(targetTier);
      if (targetIdx <= currentIdx) {
        return NextResponse.json(
          { error: `Cannot regenerate: target tier "${targetTier}" must be higher than current tier "${currentTier}"` },
          { status: 400 }
        );
      }
    }

    const effectiveTier = targetTier || currentTier;
    const isUpgrade = !!targetTier && targetTier !== currentTier;

    // Fetch original planning data from Blob
    const planningData = await getReportPlanningData(id);
    if (!planningData) {
      return NextResponse.json({ error: 'Planning data not found for regeneration' }, { status: 500 });
    }

    // Regenerate: calc → Claude narrative + executive summary (comprehensive) → PDF
    const baseReport = generateFullReport(planningData);

    // Fire both Claude calls in parallel — saves 4-8s on comprehensive regenerates.
    // Exec summary is comprehensive-only; for other tiers it resolves to undefined.
    const [newNarrative, executiveSummary] = await Promise.all([
      generateClaudeNarrative(baseReport, planningData, entry.userName, effectiveTier),
      effectiveTier === 'comprehensive'
        ? buildExecutiveSummary(baseReport, planningData, entry.userName)
        : Promise.resolve(undefined),
    ]);

    const fullReport: FinancialHealthReport = {
      ...baseReport,
      claudeNarrative: newNarrative,
      // V2 fields — only present on comprehensive reports
      ...(executiveSummary ? { executiveSummary } : {}),
    } as FinancialHealthReport;

    // Generate PDF at the effective tier level. Versioned path so each
    // regeneration produces a fresh URL — sidesteps the Vercel Blob CDN
    // edge cache that was previously serving the stale PDF.
    const pdfBuffer = generateFinancialReport(fullReport, planningData, entry.userName, effectiveTier);
    const newPdfUrl = await updateReportPdf(id, pdfBuffer, `v${entry.narrativeVersion + 1}-${Date.now()}`);

    console.log(`[Regenerate] New narrative + PDF for ${id} (tier: ${effectiveTier}${isUpgrade ? ` upgraded from ${currentTier}` : ''}, ${newNarrative.length} chars, ${(pdfBuffer.length / 1024).toFixed(0)}KB)`);

    const historyEntry: EditHistoryEntry = {
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'narrative_regenerated',
      details: isUpgrade
        ? `Report regenerated as ${effectiveTier} tier (upgraded from ${currentTier}). Narrative: ${newNarrative.length} chars`
        : `AI narrative regenerated (${newNarrative.length} chars)`,
    };

    const updates: Record<string, unknown> = {
      claudeNarrative: newNarrative,
      editedNarrative: null, // Clear any manual edits
      narrativeVersion: entry.narrativeVersion + 1,
      pdfBlobUrl: newPdfUrl,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminEmail,
      editHistory: [...entry.editHistory, historyEntry],
    };

    // Persist the executive summary on the entry so re-renders of the PDF
    // (without recomputing Claude) keep showing the bespoke per-goal narrative.
    if (executiveSummary) {
      updates.executiveSummary = executiveSummary;
    }

    // Update tier if upgrading
    if (isUpgrade) {
      updates.tier = effectiveTier;
    }

    await updateReportEntry(id, updates);

    return NextResponse.json({
      success: true,
      narrative: newNarrative,
      narrativeVersion: entry.narrativeVersion + 1,
      tier: effectiveTier,
      upgraded: isUpgrade,
    });
  } catch (error) {
    console.error('[Regenerate] Error:', error);
    return NextResponse.json({ error: 'Failed to regenerate report' }, { status: 500 });
  }
}
