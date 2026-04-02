import { NextRequest, NextResponse } from 'next/server';
import {
  getReportEntry,
  updateReportEntry,
  getReportPlanningData,
  updateReportPdf,
} from '@/lib/admin/report-queue-store';
import { generateClaudeNarrative } from '@/lib/utils/claude-narrative';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { generateFullReport } from '@/lib/utils/financial-planning-calc';
import type { EditHistoryEntry, PlanTierLabel } from '@/types/report-queue';
import type { FinancialHealthReport } from '@/types/financial-planning';

export const maxDuration = 30;

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

    // Regenerate: calc → Claude narrative → PDF
    const baseReport = generateFullReport(planningData);
    const newNarrative = await generateClaudeNarrative(baseReport, planningData, entry.userName);

    const fullReport: FinancialHealthReport = {
      ...baseReport,
      claudeNarrative: newNarrative,
    };

    // Generate PDF at the effective tier level
    const pdfBuffer = generateFinancialReport(fullReport, planningData, entry.userName, effectiveTier);
    const newPdfUrl = await updateReportPdf(id, pdfBuffer);

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
