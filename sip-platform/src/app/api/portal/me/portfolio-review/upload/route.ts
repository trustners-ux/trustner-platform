/**
 * POST /api/portal/me/portfolio-review/upload
 *
 * Client-facing CAS upload → auto Portfolio Diagnostic.
 *
 * Flow:
 *   1. Verify portal session (cookie-based JWT)
 *   2. Accept multipart/form-data with PDF + optional password
 *   3. Parse CAS via parseCasPdf
 *   4. Create/find pd_client_families row linked to the client
 *   5. Create pd_diagnostic_runs + holdings + SIPs
 *   6. Auto-score via scoreDiagnostic
 *   7. Return run ID + summary for the results page
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { parseCasPdf, sanitizeSchemeName } from '@/lib/portfolio-diagnostic/cas-parser';
import { scoreDiagnostic } from '@/lib/portfolio-diagnostic/score-runner';
import { METHODOLOGY_VERSION } from '@/lib/portfolio-diagnostic/methodology';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function inrRupees(n: number | null | undefined): number {
  if (n === null || n === undefined || !isFinite(n)) return 0;
  return Math.round(n);
}

export async function POST(req: NextRequest) {
  const session = await getPortalSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('pdf') as File | null;
  const password = (formData.get('password') as string)?.trim() || undefined;

  if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ ok: false, error: 'Please upload a PDF file' }, { status: 400 });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'File too large (max 15 MB)' }, { status: 400 });
  }

  // Parse CAS PDF
  const pdfBuffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseCasPdf({ pdfBuffer, password });

  if (!parsed.success || parsed.holdings.length === 0) {
    return NextResponse.json({
      ok: false,
      error: parsed.error || 'No holdings found in the PDF. Please upload a CAS (Consolidated Account Statement) from CAMS or KFintech.',
    }, { status: 422 });
  }

  // Look up the client record for family name
  const { data: client } = await sb
    .from('clients')
    .select('id, display_name, pan, mobile_primary, email_primary')
    .eq('id', session.clientId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client record not found' }, { status: 404 });
  }

  const familyName = (client.display_name as string) || session.displayName;

  try {
    // Find or create PD family linked to this client
    let familyId: number;

    const { data: existingFamily } = await sb
      .from('pd_client_families')
      .select('id')
      .eq('primary_contact_mobile', (client.mobile_primary as string) || '')
      .maybeSingle();

    if (existingFamily) {
      familyId = existingFamily.id as number;
    } else {
      const familyCode = `${familyName.replace(/\s/g, '').slice(0, 3).toUpperCase()}-P${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newFamily, error: famErr } = await sb
        .from('pd_client_families')
        .insert({
          family_code: familyCode,
          family_name: familyName,
          primary_contact_name: familyName,
          primary_contact_email: (client.email_primary as string) || null,
          primary_contact_mobile: (client.mobile_primary as string) || null,
          primary_contact_pan_encrypted: (client.pan as string) || null,
          segment: 'retail' as const,
          notes: `Self-service upload via client portal (${session.clientCode})`,
        })
        .select('id')
        .single();

      if (famErr || !newFamily) {
        return NextResponse.json({ ok: false, error: 'Failed to create family record' }, { status: 500 });
      }
      familyId = newFamily.id as number;
    }

    // Create entities (one per unique investor name in the CAS)
    const uniqueEntityNames = new Set([
      ...parsed.holdings.map((h) => h.entityName),
      ...parsed.sips.map((s) => s.entityName),
    ]);

    const entityIdByName = new Map<string, number>();
    for (const entityName of uniqueEntityNames) {
      if (!entityName.trim()) continue;

      const { data: existing } = await sb
        .from('pd_family_entities')
        .select('id')
        .eq('family_id', familyId)
        .eq('entity_name', entityName)
        .maybeSingle();

      if (existing) {
        entityIdByName.set(entityName, existing.id as number);
        continue;
      }

      const entityType = parsed.holdings.find((h) => h.entityName === entityName)?.entityType ?? 'Individual';
      const { data: newEntity } = await sb
        .from('pd_family_entities')
        .insert({ family_id: familyId, entity_name: entityName, entity_type: entityType })
        .select('id')
        .single();

      if (newEntity) entityIdByName.set(entityName, newEntity.id as number);
    }

    // Compute snapshot totals
    const totalInvested = parsed.holdings.reduce((s, h) => s + h.investedAmount, 0);
    const totalCurrent = parsed.holdings.reduce((s, h) => s + h.currentValue, 0);
    const activeSips = parsed.sips.filter((s) => s.status === 'Active');
    const monthlySipFlow = activeSips.reduce((s, sip) => s + sip.monthlyAmountInr, 0);
    const uniqueFunds = new Set(parsed.holdings.map((h) => h.fundName));
    const uniqueAmcs = new Set(parsed.holdings.map((h) => h.amcName ?? '').filter(Boolean));

    // Generate document ID
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const familyShort = familyName.replace(/\s/g, '').slice(0, 3).toUpperCase();
    const documentId = `${familyShort}-SELF-${dateStr}-${Math.floor(Math.random() * 900 + 100)}`;

    // Create diagnostic run (no employee — portal self-service)
    const { data: run, error: runErr } = await sb
      .from('pd_diagnostic_runs')
      .insert({
        document_id: documentId,
        family_id: familyId,
        methodology_version: METHODOLOGY_VERSION,
        status: 'DRAFT',
        uploaded_by_employee_id: null,
        family_name: familyName,
        num_entities: entityIdByName.size,
        num_holdings: parsed.holdings.length,
        num_active_sips: activeSips.length,
        num_unique_funds: uniqueFunds.size,
        num_amcs: uniqueAmcs.size,
        total_invested_inr: inrRupees(totalInvested),
        current_value_inr: inrRupees(totalCurrent),
        unrealised_gain_inr: inrRupees(totalCurrent - totalInvested),
        monthly_sip_flow_inr: inrRupees(monthlySipFlow),
        annual_sip_flow_inr: inrRupees(monthlySipFlow * 12),
      })
      .select('id')
      .single();

    if (runErr || !run) {
      return NextResponse.json({ ok: false, error: `Failed to create review: ${runErr?.message}` }, { status: 500 });
    }

    const diagnosticRunId = run.id as number;

    // Insert holdings
    const holdingRows = parsed.holdings
      .filter((h) => entityIdByName.has(h.entityName))
      .map((h) => ({
        diagnostic_run_id: diagnosticRunId,
        entity_id: entityIdByName.get(h.entityName)!,
        fund_name: sanitizeSchemeName(h.fundName),
        folio_number: h.folioNumber,
        units: h.units,
        invested_inr: inrRupees(h.investedAmount),
        current_value_inr: inrRupees(h.currentValue),
        unrealised_gain_inr: inrRupees(h.currentValue - h.investedAmount),
        first_investment_date: h.firstInvestmentDate,
        verdict: 'WATCH',
        verdict_rationale: 'Pending analysis.',
      }));

    if (holdingRows.length > 0) {
      await sb.from('pd_diagnostic_holdings').insert(holdingRows);
    }

    // Insert SIPs
    if (parsed.sips.length > 0) {
      const sipRows = parsed.sips
        .filter((s) => entityIdByName.has(s.entityName))
        .map((s) => ({
          diagnostic_run_id: diagnosticRunId,
          entity_id: entityIdByName.get(s.entityName)!,
          fund_name: s.fundName,
          folio_number: s.folioNumber,
          monthly_amount_inr: Math.round(s.monthlyAmountInr),
          actual_amount_inr: Math.round(s.actualAmountInr),
          frequency: s.frequency,
          sip_day_of_month: s.sipDayOfMonth,
          start_date: s.startDate,
          end_date: s.endDate,
          status: s.status,
          has_step_up: s.hasStepUp ?? false,
          step_up_pct: s.stepUpPct,
          step_up_frequency: s.stepUpFrequency,
          installments_completed: s.installmentsCompleted,
          total_installments: s.totalInstallments,
          next_installment_date: s.nextInstallmentDate,
          bank_mandate_status: s.bankMandateStatus,
        }));

      if (sipRows.length > 0) {
        await sb.from('pd_diagnostic_sips').insert(sipRows);
      }
    }

    // Log the portal upload event
    await sb.from('pd_workflow_events').insert({
      diagnostic_run_id: diagnosticRunId,
      actor_employee_id: null,
      actor_role: 'client_portal',
      action: 'CREATE_DRAFT',
      to_status: 'DRAFT',
      notes: `Self-service upload by ${session.displayName} (${session.clientCode}) via portal`,
    });

    // Auto-score
    const scoreResult = await scoreDiagnostic(sb, diagnosticRunId, {
      actorEmail: session.loginEmail || session.loginMobile || session.clientCode,
    });

    // Update status to SUBMITTED (client uploaded + scored → ready for RM review)
    if (scoreResult.ok) {
      await sb.from('pd_diagnostic_runs')
        .update({ status: 'SUBMITTED' })
        .eq('id', diagnosticRunId);

      await sb.from('pd_workflow_events').insert({
        diagnostic_run_id: diagnosticRunId,
        actor_employee_id: null,
        actor_role: 'client_portal',
        action: 'AUTO_SUBMIT',
        from_status: 'DRAFT',
        to_status: 'SUBMITTED',
        notes: 'Auto-submitted after portal self-service scoring',
      });
    }

    return NextResponse.json({
      ok: true,
      diagnosticRunId,
      documentId,
      summary: {
        investorName: parsed.investorName,
        holdings: parsed.holdings.length,
        sips: parsed.sips.length,
        totalInvestedInr: inrRupees(totalInvested),
        currentValueInr: inrRupees(totalCurrent),
        gainInr: inrRupees(totalCurrent - totalInvested),
        gainPct: totalInvested > 0 ? Number(((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1)) : 0,
        scored: scoreResult.scored ?? 0,
        verdictCounts: scoreResult.verdictCounts ?? {},
      },
    });
  } catch (e) {
    console.error('[Portal PD Upload] Error:', e);
    return NextResponse.json({
      ok: false,
      error: `Upload processing failed: ${(e as Error).message}`,
    }, { status: 500 });
  }
}
