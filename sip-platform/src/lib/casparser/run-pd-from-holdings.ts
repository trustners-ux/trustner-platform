/**
 * Shared helper: create a PD diagnostic run from RawHolding[] / RawSip[].
 *
 * Used by both the PDF upload route and the PAN+OTP verify route
 * so the PD pipeline is identical regardless of CAS source.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeSchemeName } from '@/lib/portfolio-diagnostic/cas-parser';
import { scoreDiagnostic } from '@/lib/portfolio-diagnostic/score-runner';
import { METHODOLOGY_VERSION } from '@/lib/portfolio-diagnostic/methodology';
import { sendWhatsAppText } from '@/lib/messaging/whatsapp';
import { randomUUID } from 'crypto';
import type { CasParseResult } from '@/lib/portfolio-diagnostic/cas-parser';

function inrRupees(n: number | null | undefined): number {
  if (n === null || n === undefined || !isFinite(n)) return 0;
  return Math.round(n);
}

function inrShort(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface PdRunResult {
  resultsToken: string;
  diagnosticRunId: number;
  verdictSummary: string;
}

export async function createPdRunFromHoldings(
  supabase: SupabaseClient,
  parsed: CasParseResult,
  lead: { name: string; mobile: string; ip: string; source: string }
): Promise<PdRunResult> {
  const { holdings } = parsed;
  const resultsToken = randomUUID();

  // Find or create PD family
  let familyId: number;
  const { data: existingFamily } = await supabase
    .from('pd_client_families')
    .select('id')
    .eq('primary_contact_mobile', lead.mobile)
    .maybeSingle();

  if (existingFamily) {
    familyId = existingFamily.id as number;
  } else {
    const familyCode = `FPC-${lead.name.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: newFamily, error: famErr } = await supabase
      .from('pd_client_families')
      .insert({
        family_code: familyCode,
        family_name: lead.name,
        primary_contact_name: lead.name,
        primary_contact_mobile: lead.mobile,
        segment: 'prospect' as const,
        notes: `Free Portfolio Check lead (${lead.source})`,
      })
      .select('id')
      .single();

    if (famErr || !newFamily) throw new Error(`Family create failed: ${famErr?.message}`);
    familyId = newFamily.id as number;
  }

  // Create entities
  const uniqueEntityNames = new Set([
    ...parsed.holdings.map((h) => h.entityName),
    ...parsed.sips.map((s) => s.entityName),
  ]);

  const entityIdByName = new Map<string, number>();
  for (const entityName of uniqueEntityNames) {
    if (!entityName.trim()) continue;

    const { data: existing } = await supabase
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
    const { data: newEntity } = await supabase
      .from('pd_family_entities')
      .insert({ family_id: familyId, entity_name: entityName, entity_type: entityType })
      .select('id')
      .single();

    if (newEntity) entityIdByName.set(entityName, newEntity.id as number);
  }

  // Compute totals
  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.currentValue, 0);
  const activeSips = parsed.sips.filter((s) => s.status === 'Active');
  const monthlySipFlow = activeSips.reduce((s, sip) => s + sip.monthlyAmountInr, 0);
  const uniqueFunds = new Set(holdings.map((h) => h.fundName));
  const uniqueAmcs = new Set(holdings.map((h) => h.amcName ?? '').filter(Boolean));

  // Document ID
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const documentId = `FPC-${dateStr}-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Create diagnostic run
  const { data: run, error: runErr } = await supabase
    .from('pd_diagnostic_runs')
    .insert({
      document_id: documentId,
      family_id: familyId,
      methodology_version: METHODOLOGY_VERSION,
      status: 'DRAFT',
      uploaded_by_employee_id: null,
      family_name: lead.name,
      num_entities: entityIdByName.size,
      num_holdings: holdings.length,
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

  if (runErr || !run) throw new Error(`Run create failed: ${runErr?.message}`);
  const diagnosticRunId = run.id as number;

  // Insert holdings
  const holdingRows = holdings
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
    await supabase.from('pd_diagnostic_holdings').insert(holdingRows);
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
      await supabase.from('pd_diagnostic_sips').insert(sipRows);
    }
  }

  // Audit log
  await supabase.from('pd_workflow_events').insert({
    diagnostic_run_id: diagnosticRunId,
    actor_employee_id: null,
    actor_role: 'free_portfolio_check',
    action: 'CREATE_DRAFT',
    to_status: 'DRAFT',
    notes: `Free Portfolio Check by ${lead.name} (${lead.mobile}) via ${lead.source}`,
  });

  // Auto-score
  const scoreResult = await scoreDiagnostic(supabase, diagnosticRunId, {
    actorEmail: `fpc:${lead.mobile}`,
  });

  let verdictSummary = 'scoring pending';
  if (scoreResult.ok) {
    await supabase.from('pd_diagnostic_runs')
      .update({ status: 'SUBMITTED' })
      .eq('id', diagnosticRunId);

    await supabase.from('pd_workflow_events').insert({
      diagnostic_run_id: diagnosticRunId,
      actor_employee_id: null,
      actor_role: 'free_portfolio_check',
      action: 'AUTO_SUBMIT',
      from_status: 'DRAFT',
      to_status: 'SUBMITTED',
      notes: `Auto-submitted after free portfolio check scoring (${lead.source})`,
    });

    verdictSummary = `${scoreResult.verdictCounts?.STAR ?? 0} star · ${scoreResult.verdictCounts?.KEEP ?? 0} keep · ${scoreResult.verdictCounts?.WATCH ?? 0} watch · ${scoreResult.verdictCounts?.SWAP ?? 0} swap · ${scoreResult.verdictCounts?.LIQUIDATE ?? 0} exit`;
  }

  // Persist free-check record with PD linkage
  const minimalHoldings = holdings.map((h) => ({
    fund: h.fundName,
    currentValue: Math.round(h.currentValue || 0),
    invested: Math.round(h.investedAmount || 0),
  }));
  const consentRecord = { given: true, version: 'fpc-v2', timestamp: new Date().toISOString(), ip: lead.ip };

  await supabase.from('pd_free_checks').insert({
    name: lead.name,
    mobile: lead.mobile,
    consent: consentRecord,
    teaser: {
      corpusInr: Math.round(totalCurrent),
      investedInr: Math.round(totalInvested),
      gainInr: Math.round(totalCurrent - totalInvested),
      holdings: holdings.length,
      uniqueFunds: uniqueFunds.size,
      amcs: uniqueAmcs.size,
    },
    holdings: minimalHoldings,
    investor_name: parsed.investorName ?? null,
    results_token: resultsToken,
    diagnostic_run_id: diagnosticRunId,
  });

  // ── Notifications (best-effort) ──
  const corpus = totalCurrent;
  const RM_PHONE = process.env.TRUSTNER_RM_WHATSAPP || '6003903737';
  sendWhatsAppText(RM_PHONE, [
    `🔍 *Free Portfolio Check — New Lead*`,
    ``,
    `*${lead.name}* · ${lead.mobile} · via ${lead.source}`,
    `Corpus: ${inrShort(corpus)} · ${holdings.length} holdings · ${uniqueFunds.size} funds`,
    `Verdicts: ${verdictSummary}`,
    ``,
    `Results: merasip.com/portfolio-check/results/${resultsToken}`,
    `Admin PD: merasip.com/admin/portfolio-diagnostic/${diagnosticRunId}/review`,
  ].join('\n')).catch(() => {});

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Mera SIP Online <leads@merasip.com>',
        to: 'wecare@trustner.in',
        subject: `🔍 Free Portfolio Check: ${lead.name} — ${inrShort(corpus)}, ${holdings.length} holdings [${lead.source}]`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0F766E;color:#fff;padding:18px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Free Portfolio Check — Full PD Scored</h2></div>
          <div style="padding:20px;border:1px solid #e2e8f0;border-top:0;">
            <p><strong>${esc(lead.name)}</strong> · ${esc(lead.mobile)} · via ${lead.source}${parsed.investorName ? ` · CAS of ${esc(parsed.investorName)}` : ''}</p>
            <p>Corpus <strong>₹${corpus.toLocaleString('en-IN')}</strong> · ${holdings.length} holdings · ${uniqueFunds.size} funds<br/>
            Verdicts: <strong>${verdictSummary}</strong></p>
            <p>
              <a href="https://www.merasip.com/admin/portfolio-diagnostic/${diagnosticRunId}/review" style="background:#0F766E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Review in Admin PD</a>
              &nbsp;
              <a href="https://www.merasip.com/portfolio-check/results/${resultsToken}" style="background:#1E40AF;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Client Results Page</a>
            </p>
          </div></div>`,
      }),
    }).catch(() => {});
  }

  return { resultsToken, diagnosticRunId, verdictSummary };
}
