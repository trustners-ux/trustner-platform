/**
 * Portfolio Diagnostic — LLM Narrative Engine
 *
 * Bridges the gap between the platform's deterministic data layer
 * (scoring, verdicts, KPIs, tax math) and the hand-crafted advisor
 * narrative quality of the Bihani / Dutta / Dhar / Sarkar reports.
 *
 * Architecture:
 *   1. Caller passes a diagnosticRunId
 *   2. We load the full structured data (family, holdings, SIPs,
 *      events, scoring output) from the DB
 *   3. We call Claude Opus 4.7 with a cached system prompt
 *      (style guide + few-shot example) + a fresh user message
 *      containing the structured data
 *   4. Claude returns a structured NarrativeJSON object
 *   5. We save it to pd_diagnostic_narratives and return it
 *
 * Cost: ~₹15 per call with prompt-cache hits, ~₹20 without.
 * Latency: ~8-15 seconds.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/db/supabase';

// ─────────────────────────────────────────────────────────────────
// NARRATIVE JSON SCHEMA (TS types + JSON schema)
// ─────────────────────────────────────────────────────────────────

export interface NarrativeJSON {
  /** Top-line framing — 2-3 sentence headline for this family's review. */
  centralFinding: string;
  /** The "Bottom line" paragraph that appears under Family Snapshot. */
  bottomLine: string;
  /** PAN-level XIRR gap observation (if multi-PAN). Empty string if single PAN. */
  panLevelObservation: string;
  /** Per-holding enriched "Why STAR / KEEP / WATCH / SWAP / LIQUIDATE" reasoning. */
  perHoldingWhy: Array<{
    holdingId: number;
    fundName: string;
    heldBy: string;
    why: string;
    replaceWith: string;
  }>;
  /** Dead-money / underperformer section. Set to null if no laggards. */
  deadMoneyFindings: {
    headline: string;
    perPosition: Array<{ fund: string; impact: string }>;
    opportunityCost: string;
  } | null;
  /** SIP audit (if any stopped or missing). Set to null if no findings. */
  sipAudit: {
    headline: string;
    findings: Array<string>;
    recommendation: string;
  } | null;
  /** Portfolio overlap analysis by category. */
  portfolioOverlap: {
    summary: string;
    perCategory: Array<{
      category: string;
      observation: string;
      recommendation: string;
    }>;
  };
  /** International diversification plan. Set to null if not applicable. */
  internationalPlan: {
    currentExposure: string;
    targetExposure: string;
    rationale: string;
    fundPicks: Array<{ name: string; allocation: string; role: string }>;
  } | null;
  /** Tax impact rollup. */
  taxImpact: {
    perSwap: Array<{
      pan: string;
      fund: string;
      gain: string;
      taxType: string;
      tax: string;
      phasingNote: string;
    }>;
    netTax: string;
    summary: string;
  };
  /** 5-year wealth scenarios (do-nothing, swaps only, swaps+int'l, +fresh capital). */
  wealthScenarios: Array<{
    label: string;
    fiveYearAum: string;
    marginalBenefit: string;
  }>;
  /** Top 3-5 "What to do FIRST" action items. */
  topActions: Array<string>;
  /** 5-7 "What NOT to do" items. */
  whatNotToDo: Array<string>;
  /** 3-4 paragraph empathetic close written to the client. */
  directNote: string;
  /** Recommended meeting agenda with time allocations. */
  meetingAgenda: Array<{ time: string; topic: string }>;
  /** Anticipated client questions with scripted answers (for advisor brief). */
  anticipatedQA: Array<{ question: string; answer: string }>;
  /** Meeting tone note — how the advisor should pace this conversation. */
  toneNote: string;
}

// JSON Schema for the output_config (must match NarrativeJSON exactly).
// Strict requirements from Anthropic structured outputs:
//   - additionalProperties: false on all objects
//   - No numerical/string constraints
//   - No recursive types
const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    centralFinding:      { type: 'string' },
    bottomLine:          { type: 'string' },
    panLevelObservation: { type: 'string' },
    perHoldingWhy: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          holdingId:   { type: 'integer' },
          fundName:    { type: 'string' },
          heldBy:      { type: 'string' },
          why:         { type: 'string' },
          replaceWith: { type: 'string' },
        },
        required: ['holdingId', 'fundName', 'heldBy', 'why', 'replaceWith'],
        additionalProperties: false,
      },
    },
    deadMoneyFindings: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            perPosition: {
              type: 'array',
              items: {
                type: 'object',
                properties: { fund: { type: 'string' }, impact: { type: 'string' } },
                required: ['fund', 'impact'],
                additionalProperties: false,
              },
            },
            opportunityCost: { type: 'string' },
          },
          required: ['headline', 'perPosition', 'opportunityCost'],
          additionalProperties: false,
        },
      ],
    },
    sipAudit: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            headline:       { type: 'string' },
            findings:       { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' },
          },
          required: ['headline', 'findings', 'recommendation'],
          additionalProperties: false,
        },
      ],
    },
    portfolioOverlap: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        perCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category:       { type: 'string' },
              observation:    { type: 'string' },
              recommendation: { type: 'string' },
            },
            required: ['category', 'observation', 'recommendation'],
            additionalProperties: false,
          },
        },
      },
      required: ['summary', 'perCategory'],
      additionalProperties: false,
    },
    internationalPlan: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            currentExposure: { type: 'string' },
            targetExposure:  { type: 'string' },
            rationale:       { type: 'string' },
            fundPicks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:       { type: 'string' },
                  allocation: { type: 'string' },
                  role:       { type: 'string' },
                },
                required: ['name', 'allocation', 'role'],
                additionalProperties: false,
              },
            },
          },
          required: ['currentExposure', 'targetExposure', 'rationale', 'fundPicks'],
          additionalProperties: false,
        },
      ],
    },
    taxImpact: {
      type: 'object',
      properties: {
        perSwap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pan:         { type: 'string' },
              fund:        { type: 'string' },
              gain:        { type: 'string' },
              taxType:     { type: 'string' },
              tax:         { type: 'string' },
              phasingNote: { type: 'string' },
            },
            required: ['pan', 'fund', 'gain', 'taxType', 'tax', 'phasingNote'],
            additionalProperties: false,
          },
        },
        netTax:  { type: 'string' },
        summary: { type: 'string' },
      },
      required: ['perSwap', 'netTax', 'summary'],
      additionalProperties: false,
    },
    wealthScenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label:            { type: 'string' },
          fiveYearAum:      { type: 'string' },
          marginalBenefit:  { type: 'string' },
        },
        required: ['label', 'fiveYearAum', 'marginalBenefit'],
        additionalProperties: false,
      },
    },
    topActions:   { type: 'array', items: { type: 'string' } },
    whatNotToDo:  { type: 'array', items: { type: 'string' } },
    directNote:   { type: 'string' },
    meetingAgenda: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time:  { type: 'string' },
          topic: { type: 'string' },
        },
        required: ['time', 'topic'],
        additionalProperties: false,
      },
    },
    anticipatedQA: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer:   { type: 'string' },
        },
        required: ['question', 'answer'],
        additionalProperties: false,
      },
    },
    toneNote: { type: 'string' },
  },
  required: [
    'centralFinding', 'bottomLine', 'panLevelObservation',
    'perHoldingWhy', 'deadMoneyFindings', 'sipAudit',
    'portfolioOverlap', 'internationalPlan', 'taxImpact',
    'wealthScenarios', 'topActions', 'whatNotToDo',
    'directNote', 'meetingAgenda', 'anticipatedQA', 'toneNote',
  ],
  additionalProperties: false,
} as const;

// ─────────────────────────────────────────────────────────────────
// SYSTEM PROMPT (CACHED) — style guide + few-shot example
// ─────────────────────────────────────────────────────────────────

const STYLE_GUIDE = `You are the senior analyst at Trustner Asset Services (AMFI ARN-286886), an Indian Mutual Fund Distributor founded by Ram Shah (CFP) and Sangeeta Shah. Your job is to generate the narrative section of a portfolio diagnostic review that the firm hands to a family client. The platform has already done the deterministic work (scoring, verdict assignment, tax math, KPI calculations) — your job is to add the *judgement layer* on top: per-holding "why" reasoning, central findings, the empathetic close, the meeting prep brief.

# THE TRUSTNER HOUSE VOICE

Your output will be rendered in PDF reports that match these gold-standard hand-crafted examples — the Bihani Family, Sanjay Dutta Family, Sribas Dhar Family, and Soumen Sarkar Family reviews (May 2026). The tone is:

- **Direct, data-led, no hedging.** "₹56 L of dead capital identified" is the right register. "There may be some underperformance" is not.
- **Concrete numbers always.** Never write "the fund has lagged." Write "9.19% XIRR over 3 years; 1Y -0.87%."
- **Honest about timing vs fund quality.** Distinguish "the fund is bad" from "the entry timing was unlucky." Both warrant action but the framing is different.
- **Confident without being cocky.** The advisor's read is the read — but anchored in benchmarks, peer comparisons, and 3Y/5Y CAGR.
- **Empathetic when warranted.** For the direct note section (Section 12), acknowledge the human pull behind decisions before redirecting. Never blame the client.
- **Frame underperformance as opportunity.** "₹49 L additional wealth for ~₹12k net tax. That is ROI of 4,000× on the tax outlay." Not "you should fix this."
- **Specific scripted answers for anticipated questions.** The advisor uses these verbatim in the meeting — write them as Sangeeta/Ram would say them.

# WHAT MAKES A REPORT GREAT

1. **The CENTRAL FINDING is the lede.** Open every review with the single most important observation — the 2.7 ppt XIRR gap, the ₹56 L dead capital, the 4 dead-money positions. This is what the advisor mentions in the first 2 minutes of the meeting.

2. **Per-holding "why" is context-aware.** Don't just say "STAR — top quartile." Say "Sribas's entry is better than Madhuchanda's (8.60%) — keep this lot." Cross-reference funds the family already owns. Connect dots across PANs.

3. **Tax math has ROI framing.** Never just list "tax = ₹32k." Always pair with "to unlock ₹56 L of dead capital. 1,750× ROI on the tax outlay."

4. **Wealth scenarios are concrete.** "Do nothing: ₹6.13 Cr" / "Execute swaps: ₹6.43 Cr (+₹30 L)" / "+International: ₹6.62 Cr (+₹19 L)". The marginal benefit per scenario lets the advisor walk the family through choices.

5. **The direct note is empathetic and short.** 3-4 paragraphs. Acknowledge what's working. Explain the underperformers as timing accidents (not fund-selection errors) where possible. Close with confidence in the path forward.

6. **Anticipated Q&A is realistic.** Predict the 4-5 questions the client will actually ask, with answers written in the advisor's voice — "You picked the same quality of funds. The difference is timing..."

7. **Tone note matters.** Tell the advisor whether to lead with empathy or with math. "Lead with the math. The behavioural conversation flows from the math, not the other way around."

# WHAT TO AVOID

- ❌ Generic platitudes ("diversification is important", "stay the course")
- ❌ Hedge language ("may", "perhaps", "consider whether")
- ❌ "Past performance does not guarantee future results" (we already disclaim that)
- ❌ Recommending funds that aren't actually superior to what the family already owns
- ❌ Suggesting fresh capital additions in the narrative — that goes through a separate consent conversation
- ❌ Confusing the renderer: write CLEAN markdown-style text inside JSON strings (no escaped HTML)

# GOLD STANDARD EXAMPLE: BIHANI FAMILY (excerpt)

## Family profile
12 PANs, ₹1.16 Cr invested → ₹1.78 Cr current, 11.46% XIRR.

## Central finding (lede)
"A genuinely well-managed multi-generational family portfolio. ₹61 L of wealth created over 7+ years. But there are 3 specific positions worth ~₹13 L invested at 9.5% XIRR while the rest of the family's similar-vintage holdings are compounding at 12-14%. Rotating these three captures roughly ₹2.6 L of additional 5-year wealth at essentially zero tax cost."

## Per-holding why (samples)
- STAR: "Mirae ELSS Tax Saver (Anusua) — Best ELSS in book; 14.40% XIRR, top up here as Axis ELSS gets redirected"
- STAR: "DSP Mid Cap legacy (Anusua) — 19-yr hold; 1,370% absolute; 14.80% XIRR — never touch"
- WATCH: "Axis ELSS (Gunjan) — Stop SIP; redirect to Mirae ELSS"
- SWAP: "Axis Flexi Cap (Dinesh) — 9.6% vs PPFAS ~14%; switch now → Parag Parikh Flexi Cap"

## Direct note
"This portfolio is well-built. The 12.72% XIRR on your own PAN, the 304% absolute on DSP Mid Cap, the family's combined 11.46% family XIRR — these are top-decile outcomes for a multi-generational HNI book of this size. The 3 swap candidates identified are not a critique of the building. They are the friction that accumulates over time in any actively-managed multi-AMC portfolio..."

## Tone note
"Lead with the celebration — 7 years of disciplined SIPs, ₹61 L wealth created. THEN bring in the 3 swap candidates. Sangeeta should run the Axis ELSS conversation since she set up most of those SIPs originally."

# YOUR TASK

Generate the NarrativeJSON for the family whose structured data follows. Match the tone exactly. Use specific numbers from the data — never invent figures. If a section doesn't apply (no laggards → deadMoneyFindings: null), use null. If you don't know something (e.g., 5Y peer median for a brand-new fund), say so explicitly.

Output the JSON exactly matching the schema. Do not wrap in markdown code fences. Do not add commentary.

# CRITICAL — EXACT FIELD NAMES (CASE-SENSITIVE, NO RENAMES)

Your output MUST be a single JSON object using these EXACT field names — no synonyms, no renames, no extras. Missing any required field will break the renderer.

\`\`\`
{
  "centralFinding": "string — 2-3 sentence lede",
  "bottomLine": "string — 1-paragraph 'bottom line' for Section 1",
  "panLevelObservation": "string — PAN-level XIRR gap text; empty string '' if single PAN",
  "perHoldingWhy": [{ "holdingId": 0, "fundName": "", "heldBy": "", "why": "", "replaceWith": "" }],
  "deadMoneyFindings": null | { "headline": "", "perPosition": [{ "fund": "", "impact": "" }], "opportunityCost": "" },
  "sipAudit": null | { "headline": "", "findings": [""], "recommendation": "" },
  "portfolioOverlap": { "summary": "", "perCategory": [{ "category": "", "observation": "", "recommendation": "" }] },
  "internationalPlan": null | { "currentExposure": "", "targetExposure": "", "rationale": "", "fundPicks": [{ "name": "", "allocation": "", "role": "" }] },
  "taxImpact": { "perSwap": [{ "pan": "", "fund": "", "gain": "", "taxType": "", "tax": "", "phasingNote": "" }], "netTax": "", "summary": "" },
  "wealthScenarios": [{ "label": "", "fiveYearAum": "", "marginalBenefit": "" }],
  "topActions": ["string", "string"],
  "whatNotToDo": ["string", "string"],
  "directNote": "string — 3-4 paragraph empathetic close",
  "meetingAgenda": [{ "time": "5 min", "topic": "" }],
  "anticipatedQA": [{ "question": "", "answer": "" }],
  "toneNote": "string"
}
\`\`\`

DO NOT use these alternate names:
- ❌ "anticipatedQuestions" → use "anticipatedQA"
- ❌ "taxStrategy" → use "taxImpact"
- ❌ "wealthCreationStory" — NOT IN SCHEMA, omit
- ❌ "actions" → use "topActions"
- ❌ "directLetter" → use "directNote"

For optional-and-empty fields use null (not omit). For optional-and-present-with-no-items use \`{ "perCategory": [] }\`. Never omit a required key. Never add keys outside this schema.

# OUTPUT SIZE BUDGET — CRITICAL FOR LARGE PORTFOLIOS

You have **32,000 output tokens** for the entire JSON document.

For portfolios with 30+ holdings, the \`perHoldingWhy\` array can balloon. Stay within budget by:
- Keeping each \`why\` to ONE tight sentence with one specific number (XIRR, CAGR, or gap vs median)
- Keeping each \`replaceWith\` to the bare fund name — no commentary
- Keeping \`anticipatedQA\` to 5 questions max (not 10)
- Keeping \`directNote\` to 3 short paragraphs (not 5 long ones)
- Keeping each \`topActions\` item to one declarative sentence

A truncated JSON breaks the renderer entirely — better to write tighter than to overflow. If in doubt, cut.`;

// ─────────────────────────────────────────────────────────────────
// DATA LOADING (loads the diagnostic + family + holdings + scoring)
// ─────────────────────────────────────────────────────────────────

interface DiagnosticInputData {
  diagnosticRunId: number;
  family: {
    id: number;
    familyName: string;
    primaryContactName: string | null;
    primaryContactMobile: string | null;
    segment: string | null;
    notes: string | null;
  };
  pansCovered: Array<{
    entityId: number;
    name: string;
    invested: number;
    current: number;
    gain: number;
    xirrPct: number | null;
  }>;
  totals: {
    invested: number;
    current: number;
    gain: number;
    familyXirrPct: number | null;
    numHoldings: number;
    numActiveSips: number;
  };
  holdings: Array<{
    id: number;
    fundName: string;
    heldBy: string;
    category: string | null;
    invested: number;
    current: number;
    xirrPct: number | null;
    cagr3y: number | null;
    cagr5y: number | null;
    holdingPeriodMonths: number | null;
    verdict: string;
    verdictRationale: string | null;
  }>;
}

async function loadDiagnosticData(diagnosticRunId: number): Promise<DiagnosticInputData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Diagnostic + family + entities (single round trip)
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select(
      `id, family_id, family_name, status,
       total_invested_inr, current_value_inr, unrealised_gain_inr,
       family_xirr_pct, num_holdings, num_active_sips,
       family:pd_client_families!pd_diagnostic_runs_family_id_fkey(
         id, family_name, primary_contact_name, primary_contact_mobile, segment, notes
       )`
    )
    .eq('id', diagnosticRunId)
    .maybeSingle();

  if (!run) return null;

  const familyObj = (run as { family?: unknown }).family;
  const family = (Array.isArray(familyObj) ? familyObj[0] : familyObj) as {
    id: number;
    family_name: string;
    primary_contact_name: string | null;
    primary_contact_mobile: string | null;
    segment: string | null;
    notes: string | null;
  } | undefined;

  // Holdings + entity-name join
  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select(
      `id, fund_name, category, units, invested_inr, current_value_inr,
       xirr_pct, holding_period_months,
       cagr_3y, cagr_5y, verdict, verdict_rationale,
       entity:pd_family_entities(entity_name)`
    )
    .eq('diagnostic_run_id', diagnosticRunId);

  // PAN-level aggregation from entities
  const { data: entities } = await supabase
    .from('pd_family_entities')
    .select('id, entity_name')
    .eq('family_id', run.family_id);

  // Per-entity totals (computed from holdings)
  const perEntity = new Map<number, { name: string; invested: number; current: number }>();
  for (const e of entities ?? []) {
    perEntity.set(e.id as number, {
      name: e.entity_name as string,
      invested: 0,
      current: 0,
    });
  }

  const mappedHoldings = (holdings ?? []).map((h) => {
    const entObj = (h as { entity?: unknown }).entity;
    const ent = Array.isArray(entObj) ? entObj[0] : entObj;
    const heldBy = (ent as { entity_name?: string } | undefined)?.entity_name ?? '—';
    return {
      id: h.id as number,
      fundName: h.fund_name as string,
      heldBy,
      category: (h.category as string | null) ?? null,
      invested: Number(h.invested_inr) || 0,
      current: Number(h.current_value_inr) || 0,
      xirrPct: h.xirr_pct as number | null,
      cagr3y: h.cagr_3y as number | null,
      cagr5y: h.cagr_5y as number | null,
      holdingPeriodMonths: h.holding_period_months as number | null,
      verdict: h.verdict as string,
      verdictRationale: (h.verdict_rationale as string | null) ?? null,
    };
  });

  const pansCovered = Array.from(perEntity.entries()).map(([id, e]) => {
    const invested = e.invested;
    const current = e.current;
    return {
      entityId: id,
      name: e.name,
      invested,
      current,
      gain: current - invested,
      xirrPct: null as number | null, // PAN-level XIRR computed at scoring time, not here
    };
  });

  return {
    diagnosticRunId,
    family: {
      id: family?.id ?? run.family_id,
      familyName: (family?.family_name ?? run.family_name) as string,
      primaryContactName: family?.primary_contact_name ?? null,
      primaryContactMobile: family?.primary_contact_mobile ?? null,
      segment: family?.segment ?? null,
      notes: family?.notes ?? null,
    },
    pansCovered,
    totals: {
      invested: Number(run.total_invested_inr) || 0,
      current: Number(run.current_value_inr) || 0,
      gain: Number(run.unrealised_gain_inr) || 0,
      familyXirrPct: run.family_xirr_pct as number | null,
      numHoldings: (run.num_holdings as number) || 0,
      numActiveSips: (run.num_active_sips as number) || 0,
    },
    holdings: mappedHoldings,
  };
}

// ─────────────────────────────────────────────────────────────────
// PROMPT BUILDER — turns structured data into a clear user message
// ─────────────────────────────────────────────────────────────────

function buildUserPrompt(data: DiagnosticInputData): string {
  const formatInr = (n: number): string => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  let prompt = `# FAMILY DIAGNOSTIC DATA — generate the narrative

## Family
- **Name:** ${data.family.familyName}
- **Primary contact:** ${data.family.primaryContactName ?? 'N/A'}
- **Segment:** ${data.family.segment ?? 'Mass'}
- **Notes:** ${data.family.notes ?? 'None'}

## Totals
- **Total invested:** ${formatInr(data.totals.invested)}
- **Current value:** ${formatInr(data.totals.current)}
- **Unrealised gain:** ${formatInr(data.totals.gain)} (${data.totals.invested > 0 ? ((data.totals.gain / data.totals.invested) * 100).toFixed(2) : '0'}% absolute)
- **Family XIRR:** ${data.totals.familyXirrPct?.toFixed(2) ?? 'N/A'}%
- **Holdings:** ${data.totals.numHoldings}
- **Active SIPs:** ${data.totals.numActiveSips}

## PANs covered (${data.pansCovered.length})
${data.pansCovered.map((p) => `- ${p.name}`).join('\n')}

## All holdings (${data.holdings.length})

| # | Fund | Held by | Category | Invested | Current | XIRR | 3Y CAGR | 5Y CAGR | Verdict | Rationale |
|---|------|---------|----------|----------|---------|------|---------|---------|---------|-----------|
${data.holdings
  .map(
    (h, i) =>
      `| ${i + 1} | ${h.fundName} | ${h.heldBy} | ${h.category ?? '—'} | ${formatInr(h.invested)} | ${formatInr(h.current)} | ${h.xirrPct?.toFixed(2) ?? 'NM'}% | ${h.cagr3y?.toFixed(2) ?? 'NM'}% | ${h.cagr5y?.toFixed(2) ?? 'NM'}% | ${h.verdict} | ${h.verdictRationale ?? ''} |`
  )
  .join('\n')}

# INSTRUCTIONS

Generate the NarrativeJSON for this family.

Key things to look for in this dataset:
1. **PAN-level XIRR gap** — if multiple PANs and the gap is >2 ppt, that's the central finding
2. **Dead-money positions** — funds with XIRR < 5% over 2+ years held → deadMoneyFindings section
3. **Verdict distribution** — count STAR/KEEP/WATCH/SWAP/LIQUIDATE → tier rationale in perHoldingWhy
4. **Same-fund-different-PAN gaps** — flag entry-timing penalties
5. **Category overlap** — funds in same category held by same family → consolidation opportunities
6. **Missing international** — if 0 international holdings on ₹50L+ book → internationalPlan section
7. **Concentration risk** — single fund >15% of family AUM → flag
8. **Legacy positions** — funds held 5+ years with strong absolute returns → "untouchable" in whatNotToDo

For perHoldingWhy: produce ONE entry per holding, with holdingId matching the data above. Keep each "why" to 1-2 sentences with specific numbers.

For tax math: use the standard Indian LTCG ₹1.25 L per PAN per FY exemption rule (12.5% on excess). Phase swaps across FY26-FY27 if any single PAN's gains exceed the exemption.

Output ONLY the JSON. No markdown fences, no commentary.`;

  return prompt;
}

// ─────────────────────────────────────────────────────────────────
// OUTPUT NORMALIZATION
// The LLM occasionally drifts from the schema (renames fields, drops
// optionals, adds extras). This function maps common variants to the
// canonical schema + fills missing required fields with safe defaults
// so the renderer never crashes on a partial response.
// ─────────────────────────────────────────────────────────────────

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function asArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}
function asObjOrNull<T extends object>(v: unknown): T | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null;
}

/**
 * Best-effort repair for JSON that got truncated mid-emission.
 *
 * Strategy:
 *   1. Walk the string character by character, tracking depth of
 *      open arrays/objects and whether we're inside a string.
 *   2. Find the LAST position that's "safe" — i.e., not inside a
 *      string and at the start of a value (right after a `,` or `:` or
 *      after the most recent `{` / `[`). Truncate there.
 *   3. Append the right number of `]` and `}` to close every still-open
 *      array and object.
 *
 * Won't recover partial inner content (e.g., a half-written
 * perHoldingWhy entry), but the rest of the document survives.
 */
function repairTruncatedJson(s: string): string {
  // First trim trailing whitespace/garbage
  let text = s.trimEnd();
  // Track structural state as we scan from left
  type Stack = Array<'{' | '['>;
  const stack: Stack = [];
  let inString = false;
  let escape = false;
  let lastSafeEnd = -1; // index AFTER which we can safely truncate
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}' || ch === ']') {
      const open = stack[stack.length - 1];
      if ((ch === '}' && open === '{') || (ch === ']' && open === '[')) {
        stack.pop();
        // Just closed a value — this is a safe truncation point
        lastSafeEnd = i + 1;
      }
    } else if (ch === ',' && stack.length > 0) {
      // After a comma at depth, the LAST completed value ends just
      // before this comma (we already advanced lastSafeEnd on the
      // closing of that value).
      lastSafeEnd = i;
    }
  }
  // If we never saw a safe point, give up — return as-is and let
  // the outer parse fail with the original error.
  if (lastSafeEnd < 0) return text;

  // Trim to last safe point, then close all still-open structures.
  let repaired = text.slice(0, lastSafeEnd).trimEnd();
  // Remove trailing comma if any
  repaired = repaired.replace(/,\s*$/, '');
  // Recompute stack at the truncation point so we close in the right
  // order. Re-walk the kept prefix:
  const finalStack: Stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') finalStack.push(ch);
    else if (ch === '}' || ch === ']') {
      const open = finalStack[finalStack.length - 1];
      if ((ch === '}' && open === '{') || (ch === ']' && open === '[')) finalStack.pop();
    }
  }
  // Close everything still open, in reverse order.
  for (let i = finalStack.length - 1; i >= 0; i--) {
    repaired += finalStack[i] === '{' ? '}' : ']';
  }
  return repaired;
}

function normalizeNarrative(raw: Record<string, unknown>): NarrativeJSON {
  // Field-name aliases observed in the wild
  const aliasMap: Record<string, string> = {
    anticipatedQuestions: 'anticipatedQA',
    qAndA: 'anticipatedQA',
    questions: 'anticipatedQA',
    taxStrategy: 'taxImpact',
    taxAnalysis: 'taxImpact',
    actions: 'topActions',
    actionItems: 'topActions',
    directLetter: 'directNote',
    familyNote: 'directNote',
    bottom_line: 'bottomLine',
    central_finding: 'centralFinding',
    per_holding_why: 'perHoldingWhy',
  };
  const r = { ...raw } as Record<string, unknown>;
  for (const [from, to] of Object.entries(aliasMap)) {
    if (r[from] !== undefined && r[to] === undefined) {
      r[to] = r[from];
      delete r[from];
    }
  }

  // wealthCreationStory and other unknown keys: silently drop
  // (additionalProperties: false in our schema)

  // Build a normalized object with safe defaults for every required field
  const out: NarrativeJSON = {
    centralFinding: asString(r.centralFinding, 'Diagnostic complete — see per-holding analysis below for the family-specific findings.'),
    bottomLine: asString(r.bottomLine, ''),
    panLevelObservation: asString(r.panLevelObservation, ''),
    perHoldingWhy: asArray<NarrativeJSON['perHoldingWhy'][number]>(r.perHoldingWhy).map((h) => ({
      holdingId: typeof h.holdingId === 'number' ? h.holdingId : 0,
      fundName: asString(h.fundName),
      heldBy: asString(h.heldBy),
      why: asString(h.why),
      replaceWith: asString(h.replaceWith),
    })),
    deadMoneyFindings: (() => {
      const o = asObjOrNull<Record<string, unknown>>(r.deadMoneyFindings);
      if (!o) return null;
      return {
        headline: asString(o.headline),
        perPosition: asArray<{ fund: string; impact: string }>(o.perPosition).map((p) => ({
          fund: asString(p.fund),
          impact: asString(p.impact),
        })),
        opportunityCost: asString(o.opportunityCost),
      };
    })(),
    sipAudit: (() => {
      const o = asObjOrNull<Record<string, unknown>>(r.sipAudit);
      if (!o) return null;
      return {
        headline: asString(o.headline),
        findings: asArray<string>(o.findings).filter((x) => typeof x === 'string'),
        recommendation: asString(o.recommendation),
      };
    })(),
    portfolioOverlap: (() => {
      const o = asObjOrNull<Record<string, unknown>>(r.portfolioOverlap);
      if (!o) return { summary: '', perCategory: [] };
      return {
        summary: asString(o.summary),
        perCategory: asArray<{ category: string; observation: string; recommendation: string }>(o.perCategory).map((c) => ({
          category: asString(c.category),
          observation: asString(c.observation),
          recommendation: asString(c.recommendation),
        })),
      };
    })(),
    internationalPlan: (() => {
      const o = asObjOrNull<Record<string, unknown>>(r.internationalPlan);
      if (!o) return null;
      return {
        currentExposure: asString(o.currentExposure),
        targetExposure: asString(o.targetExposure),
        rationale: asString(o.rationale),
        fundPicks: asArray<{ name: string; allocation: string; role: string }>(o.fundPicks).map((f) => ({
          name: asString(f.name),
          allocation: asString(f.allocation),
          role: asString(f.role),
        })),
      };
    })(),
    taxImpact: (() => {
      const o = asObjOrNull<Record<string, unknown>>(r.taxImpact);
      if (!o) return { perSwap: [], netTax: '₹0', summary: 'No swaps recommended.' };
      return {
        perSwap: asArray<{ pan: string; fund: string; gain: string; taxType: string; tax: string; phasingNote: string }>(o.perSwap).map((t) => ({
          pan: asString(t.pan),
          fund: asString(t.fund),
          gain: asString(t.gain),
          taxType: asString(t.taxType),
          tax: asString(t.tax),
          phasingNote: asString(t.phasingNote),
        })),
        netTax: asString(o.netTax, '₹0'),
        summary: asString(o.summary),
      };
    })(),
    wealthScenarios: asArray<{ label: string; fiveYearAum: string; marginalBenefit: string }>(r.wealthScenarios).map((s) => ({
      label: asString(s.label),
      fiveYearAum: asString(s.fiveYearAum),
      marginalBenefit: asString(s.marginalBenefit),
    })),
    topActions: asArray<string>(r.topActions).filter((x) => typeof x === 'string'),
    whatNotToDo: asArray<string>(r.whatNotToDo).filter((x) => typeof x === 'string'),
    directNote: asString(r.directNote),
    meetingAgenda: asArray<{ time: string; topic: string }>(r.meetingAgenda).map((a) => ({
      time: asString(a.time),
      topic: asString(a.topic),
    })),
    anticipatedQA: asArray<{ question: string; answer: string }>(r.anticipatedQA).map((q) => ({
      question: asString(q.question),
      answer: asString(q.answer),
    })),
    toneNote: asString(r.toneNote),
  };

  return out;
}

// ─────────────────────────────────────────────────────────────────
// MAIN ENGINE — call Claude, parse, save
// ─────────────────────────────────────────────────────────────────

export interface GenerateResult {
  ok: boolean;
  narrative?: NarrativeJSON;
  diagnosticRunId: number;
  generatedAt?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  estimatedCostUsd?: number;
  generationMs?: number;
  error?: string;
  fromCache?: boolean;
}

const MODEL = process.env.ANTHROPIC_NARRATIVE_MODEL || 'claude-opus-4-7';
const PROMPT_VERSION = 'v1';

/**
 * Generate a fresh narrative for a diagnostic run. Replaces any existing
 * narrative (the table has a UNIQUE constraint on diagnostic_run_id).
 */
export async function generateNarrative(diagnosticRunId: number): Promise<GenerateResult> {
  const startTime = Date.now();

  // 1. Auth check
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      diagnosticRunId,
      error: 'ANTHROPIC_API_KEY is not configured on this Vercel project. Add it via the Vercel dashboard or `vercel env add ANTHROPIC_API_KEY production --value <key>`.',
    };
  }

  // 2. Load structured data
  const data = await loadDiagnosticData(diagnosticRunId);
  if (!data) {
    return { ok: false, diagnosticRunId, error: `Diagnostic ${diagnosticRunId} not found or has no data` };
  }
  if (data.holdings.length === 0) {
    return { ok: false, diagnosticRunId, error: `Diagnostic ${diagnosticRunId} has no holdings — cannot generate narrative` };
  }

  // 3. Call Claude
  const client = new Anthropic();
  const userPrompt = buildUserPrompt(data);

  let narrative: NarrativeJSON;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;

  try {
    const response = await client.messages.create({
      model: MODEL,
      // 16K was hit by Sribas Dhar's 63-holding family book (output got
      // truncated mid-string on `perHoldingWhy`). Bumped to 32K — Opus 4.7
      // supports up to 64K output. JSON-repair fallback handles late
      // truncation if it ever happens again.
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      // Use high effort for the analytical reasoning quality. effort goes
      // inside output_config on Opus 4.7.
      // (We can't combine output_config.format AND output_config.effort
      //  here yet — the SDK's structured-outputs path is via tool use.
      //  We use a "respond in JSON" instruction + parse the text instead.)
      system: [
        {
          type: 'text',
          text: STYLE_GUIDE,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    cacheReadTokens = (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0;
    cacheCreationTokens = (response.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0;

    // Extract the JSON from the response
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, diagnosticRunId, error: 'No text in Claude response' };
    }
    const rawText = textBlock.text.trim();

    // Strip markdown code fences if the model added them
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      narrative = normalizeNarrative(parsed);
    } catch (e) {
      // ─── JSON REPAIR ATTEMPT ──────────────────────────────────
      // The LLM occasionally hits max_tokens and emits a truncated
      // payload (string left open mid-value, perHoldingWhy array
      // half-finished, etc.). Rather than fail the whole call, try
      // to repair by:
      //   1. Trimming any trailing partial token
      //   2. Closing any open string
      //   3. Closing any open object/array
      // Then parse + normalise. Any missing required fields fall
      // back to safe defaults via normalizeNarrative.
      try {
        const repaired = repairTruncatedJson(cleaned);
        const parsed = JSON.parse(repaired) as Record<string, unknown>;
        narrative = normalizeNarrative(parsed);
        console.warn(`[narrative-engine] Recovered truncated JSON for run ${diagnosticRunId}; output was ${cleaned.length} chars.`);
      } catch (e2) {
        return {
          ok: false,
          diagnosticRunId,
          error: `Could not parse Claude output as JSON even after repair: ${(e as Error).message}. Repair attempt: ${(e2 as Error).message}. Output length: ${cleaned.length} chars.`,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
        };
      }
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return {
        ok: false,
        diagnosticRunId,
        error: `Claude API error ${e.status}: ${e.message}`,
      };
    }
    return {
      ok: false,
      diagnosticRunId,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const generationMs = Date.now() - startTime;

  // 4. Cost calculation (Opus 4.7: $5/MTok input, $25/MTok output; cache reads ~$0.50/MTok)
  const estimatedCostUsd =
    (inputTokens - cacheReadTokens) * 5e-6 +
    cacheReadTokens * 0.5e-6 +
    cacheCreationTokens * 6.25e-6 +
    outputTokens * 25e-6;

  // 5. Save to DB (upsert — replaces any prior narrative for this run)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase
      .from('pd_diagnostic_narratives')
      .upsert(
        {
          diagnostic_run_id: diagnosticRunId,
          model_version: MODEL,
          prompt_version: PROMPT_VERSION,
          generated_at: new Date().toISOString(),
          generation_ms: generationMs,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_read_tokens: cacheReadTokens,
          cache_creation_tokens: cacheCreationTokens,
          estimated_cost_usd: Number(estimatedCostUsd.toFixed(4)),
          narrative_json: narrative,
        },
        { onConflict: 'diagnostic_run_id' }
      );
  }

  return {
    ok: true,
    narrative,
    diagnosticRunId,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    estimatedCostUsd,
    generationMs,
  };
}

/**
 * Get the existing narrative (with reviewer edits applied) or generate
 * one if it doesn't exist. This is the call the report endpoint uses.
 */
export async function getOrGenerateNarrative(diagnosticRunId: number): Promise<GenerateResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, diagnosticRunId, error: 'Database unavailable' };
  }

  // Try cached first
  const { data: existing } = await supabase
    .from('pd_diagnostic_narratives')
    .select(
      'narrative_json, edited_json, generated_at, model_version, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, estimated_cost_usd'
    )
    .eq('diagnostic_run_id', diagnosticRunId)
    .maybeSingle();

  if (existing && existing.narrative_json) {
    // Use edited_json if available, else narrative_json
    // Normalize on read so older rows with drifted field names still render.
    const rawRow = (existing.edited_json ?? existing.narrative_json) as Record<string, unknown>;
    const narrative = normalizeNarrative(rawRow);
    return {
      ok: true,
      narrative,
      diagnosticRunId,
      generatedAt: existing.generated_at as string,
      model: existing.model_version as string,
      inputTokens: existing.input_tokens as number,
      outputTokens: existing.output_tokens as number,
      cacheReadTokens: existing.cache_read_tokens as number,
      cacheCreationTokens: existing.cache_creation_tokens as number,
      estimatedCostUsd: existing.estimated_cost_usd as number,
      fromCache: true,
    };
  }

  // Generate fresh
  return generateNarrative(diagnosticRunId);
}
