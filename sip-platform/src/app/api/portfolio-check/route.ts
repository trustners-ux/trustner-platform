/**
 * Free Portfolio Check — public lead magnet with FULL PD engine.
 *
 * POST multipart/form-data: { file (CAS/valuation PDF), password?, name, mobile, consent }
 *
 * Parses the CAS, runs the full PD v2 engine (scoring, verdicts, tax, overlap),
 * generates a shareable results token, and returns:
 *   { success, teaser, resultsToken, investorName }
 *
 * Client-facing results are GATED: replacement fund names show a category hint
 * ("Speak with your Trustner advisor for a Flexi Cap alternative"), not the
 * specific fund. This is the conversion mechanism — prospects see exactly
 * what needs to change, but need an RM conversation to act on it.
 *
 * Privacy: folio numbers stripped from pd_free_checks; DPDP consent recorded
 * with IP + timestamp; rate-limited per IP. Full PD data lives in
 * pd_diagnostic_runs/holdings/sips (same security as admin PD).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { parseCasPdf, sanitizeSchemeName } from '@/lib/portfolio-diagnostic/cas-parser';
import { subCategoryKey, categoryRiskTier } from '@/lib/portfolio-diagnostic/v2/fund-engine';
import { scoreDiagnostic } from '@/lib/portfolio-diagnostic/score-runner';
import { METHODOLOGY_VERSION } from '@/lib/portfolio-diagnostic/methodology';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { sendWhatsAppText } from '@/lib/messaging/whatsapp';
import { randomUUID } from 'crypto';

export const maxDuration = 60;

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const MAX_FILE_BYTES = 12 * 1024 * 1024;

function assetClassOf(category: string | null): 'equity' | 'hybrid' | 'debt' {
  const c = (category || '').toLowerCase();
  if (/aggressive hybrid|balanced advantage|dynamic asset|multi[\s-]*asset|equity savings|conservative hybrid|hybrid/.test(c)) return 'hybrid';
  if (/debt|liquid|gilt|arbitrage|duration|bond|money market|overnight|psu|credit/.test(c)) return 'debt';
  return 'equity';
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inrShort(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function inrRupees(n: number | null | undefined): number {
  if (n === null || n === undefined || !isFinite(n)) return 0;
  return Math.round(n);
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!limiter.check(ip).ok) {
    return NextResponse.json(
      { success: false, message: 'Too many checks from this connection. Please try again in an hour, or WhatsApp us directly.' },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid upload.' }, { status: 400 });
  }

  const file = form.get('file');
  const password = (form.get('password') as string | null) || undefined;
  const name = ((form.get('name') as string | null) ?? '').trim();
  const mobileRaw = ((form.get('mobile') as string | null) ?? '').replace(/\D/g, '');
  const consentGiven = form.get('consent') === 'true';

  if (!name || name.length < 2) return NextResponse.json({ success: false, message: 'Please enter your name.' }, { status: 400 });
  if (!/^\d{10}$/.test(mobileRaw)) return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
  if (!consentGiven) return NextResponse.json({ success: false, message: 'Consent is required to analyse your statement.' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: 'Please attach your CAS / portfolio PDF.' }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ success: false, message: 'File too large (max 12 MB).' }, { status: 400 });
  if (file.type && file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, message: 'Please upload a PDF file (your CAS / portfolio statement).' }, { status: 400 });
  }

  // ── Parse ──
  const pdfBuffer = Buffer.from(await file.arrayBuffer());
  if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ success: false, message: 'That file is not a valid PDF. Please upload your CAS / portfolio statement PDF.' }, { status: 400 });
  }
  const parsed = await parseCasPdf({ pdfBuffer, password });
  if (!parsed.success || parsed.holdings.length === 0) {
    return NextResponse.json({
      success: false,
      message: parsed.error
        ? `We could not read this statement: ${parsed.error}`
        : 'We could not find holdings in this PDF. Try your CAMS/KFintech CAS (Detailed) — or WhatsApp it to us and a human will run the check.',
    }, { status: 422 });
  }

  // ── Teaser computation ──
  const holdings = parsed.holdings;
  const corpus = holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
  const invested = holdings.reduce((s, h) => s + (h.investedAmount || 0), 0);
  const uniqueFundCount = new Set(holdings.map((h) => h.fundName.trim().toLowerCase())).size;
  const amcCount = new Set(holdings.map((h) => (h.amcName ?? h.fundName.split(/\s+/).slice(0, 2).join(' ')).toLowerCase())).size;

  let eq = 0, hy = 0, dt = 0, veryHigh = 0;
  const bySubCat = new Map<string, Set<string>>();
  for (const h of holdings) {
    const cat = h.fundName;
    const cls = assetClassOf(cat);
    if (cls === 'equity') eq += h.currentValue || 0;
    else if (cls === 'hybrid') hy += h.currentValue || 0;
    else dt += h.currentValue || 0;
    if (categoryRiskTier(cat) === 'Very High') veryHigh += h.currentValue || 0;
    const key = subCategoryKey(cat);
    if (key) {
      if (!bySubCat.has(key)) bySubCat.set(key, new Set());
      bySubCat.get(key)!.add(h.fundName.trim().toLowerCase());
    }
  }
  const tot = corpus || 1;
  const dupGroups = Array.from(bySubCat.values()).filter((s) => s.size > 1).length;

  const teaser = {
    corpusInr: Math.round(corpus),
    investedInr: Math.round(invested),
    gainInr: Math.round(corpus - invested),
    holdings: holdings.length,
    uniqueFunds: uniqueFundCount,
    amcs: amcCount,
    equityPct: Math.round((eq / tot) * 100),
    hybridPct: Math.round((hy / tot) * 100),
    debtPct: Math.round((dt / tot) * 100),
    veryHighRiskPct: Math.round((veryHigh / tot) * 100),
    duplicateCategoryGroups: dupGroups,
  };

  const supabase = getSupabaseAdmin();
  let resultsToken: string | null = null;

  if (supabase) {
    try {
      // ── Full PD engine ──
      resultsToken = randomUUID();

      // Find or create PD family
      let familyId: number;
      const { data: existingFamily } = await supabase
        .from('pd_client_families')
        .select('id')
        .eq('primary_contact_mobile', mobileRaw)
        .maybeSingle();

      if (existingFamily) {
        familyId = existingFamily.id as number;
      } else {
        const familyCode = `FPC-${name.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: newFamily, error: famErr } = await supabase
          .from('pd_client_families')
          .insert({
            family_code: familyCode,
            family_name: name,
            primary_contact_name: name,
            primary_contact_mobile: mobileRaw,
            segment: 'prospect' as const,
            notes: `Free Portfolio Check lead (self-service upload)`,
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
          family_name: name,
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
        notes: `Free Portfolio Check by ${name} (${mobileRaw})`,
      });

      // Auto-score
      const scoreResult = await scoreDiagnostic(supabase, diagnosticRunId, {
        actorEmail: `fpc:${mobileRaw}`,
      });

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
          notes: 'Auto-submitted after free portfolio check scoring',
        });
      }

      // Persist free-check record with PD linkage
      const minimalHoldings = holdings.map((h) => ({
        fund: h.fundName,
        currentValue: Math.round(h.currentValue || 0),
        invested: Math.round(h.investedAmount || 0),
      }));
      const consentRecord = { given: true, version: 'fpc-v2', timestamp: new Date().toISOString(), ip };

      await supabase.from('pd_free_checks').insert({
        name,
        mobile: mobileRaw,
        consent: consentRecord,
        teaser,
        holdings: minimalHoldings,
        investor_name: parsed.investorName ?? null,
        results_token: resultsToken,
        diagnostic_run_id: diagnosticRunId,
      });

      // ── Notifications (best-effort) ──
      const verdictSummary = scoreResult.ok
        ? `${scoreResult.verdictCounts?.STAR ?? 0} star · ${scoreResult.verdictCounts?.KEEP ?? 0} keep · ${scoreResult.verdictCounts?.WATCH ?? 0} watch · ${scoreResult.verdictCounts?.SWAP ?? 0} swap · ${scoreResult.verdictCounts?.LIQUIDATE ?? 0} exit`
        : 'scoring pending';

      // WhatsApp to RM team
      const RM_PHONE = process.env.TRUSTNER_RM_WHATSAPP || '6003903737';
      sendWhatsAppText(RM_PHONE, [
        `🔍 *Free Portfolio Check — New Lead*`,
        ``,
        `*${name}* · ${mobileRaw}`,
        `Corpus: ${inrShort(corpus)} · ${holdings.length} holdings · ${uniqueFundCount} funds`,
        `Mix: ${teaser.equityPct}%E / ${teaser.hybridPct}%H / ${teaser.debtPct}%D`,
        `Verdicts: ${verdictSummary}`,
        `${dupGroups > 0 ? `⚠ ${dupGroups} duplicate groups` : ''}`,
        ``,
        `Results: merasip.com/portfolio-check/results/${resultsToken}`,
        `Admin PD: merasip.com/admin/portfolio-diagnostic/${diagnosticRunId}/review`,
      ].join('\n')).catch(() => {});

      // Email notification
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Mera SIP Online <leads@merasip.com>',
            to: 'wecare@trustner.in',
            subject: `🔍 Free Portfolio Check: ${name} — ${inrShort(corpus)}, ${holdings.length} holdings`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0F766E;color:#fff;padding:18px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Free Portfolio Check — Full PD Scored</h2></div>
              <div style="padding:20px;border:1px solid #e2e8f0;border-top:0;">
                <p><strong>${esc(name)}</strong> · ${esc(mobileRaw)}${parsed.investorName ? ` · statement of ${esc(parsed.investorName)}` : ''}</p>
                <p>Corpus <strong>₹${corpus.toLocaleString('en-IN')}</strong> · ${holdings.length} holdings · ${uniqueFundCount} funds · ${amcCount} AMCs<br/>
                Mix: ${teaser.equityPct}% equity / ${teaser.hybridPct}% hybrid / ${teaser.debtPct}% debt<br/>
                Verdicts: <strong>${verdictSummary}</strong><br/>
                ${dupGroups > 0 ? `<strong>${dupGroups}</strong> duplicate-category group(s) to consolidate.` : 'No duplicate categories detected.'}</p>
                <p>
                  <a href="https://www.merasip.com/admin/portfolio-diagnostic/${diagnosticRunId}/review" style="background:#0F766E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Review in Admin PD</a>
                  &nbsp;
                  <a href="https://www.merasip.com/portfolio-check/results/${resultsToken}" style="background:#1E40AF;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Client Results Page</a>
                </p>
                <p style="font-size:12px;color:#64748B;">Full PD scored and stored in <code>pd_diagnostic_runs</code> (ID ${diagnosticRunId}). Call back within 24h.</p>
              </div></div>`,
          }),
        }).catch(() => {});
      }
    } catch (pdError) {
      console.error('[Free Portfolio Check] PD engine error (teaser still served):', pdError);
      // PD engine failure should NOT block the teaser response — the lead is still captured
    }
  }

  return NextResponse.json({
    success: true,
    teaser,
    investorName: parsed.investorName ?? null,
    resultsToken,
  });
}
