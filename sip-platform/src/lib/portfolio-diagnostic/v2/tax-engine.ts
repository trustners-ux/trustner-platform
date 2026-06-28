/**
 * Trustner Verdict Engine v2 — INDIA TAX-AWARE EXIT LAYER
 * =======================================================
 * No competitor (Morningstar, Nitrogen, RightCapital, eMoney, Value Research)
 * models INDIAN mutual-fund exit tax inside a portfolio diagnostic. This layer
 * estimates the tax cost of acting on every SWAP / EXIT / REDUCE recommendation,
 * so a review reads net-of-tax: "exit this dud — est. ~₹X tax, here's the
 * smarter sequencing."
 *
 * Uses ONLY data the engine already has (invested, current value, holding
 * period, sub-category) — no external feed. Rules as of FY2025-26
 * (post-Budget-2024, effective 23-Jul-2024):
 *   - Equity-oriented LTCG (held > 12 mo): 12.5% on gains above ₹1.25L / FY (aggregate exemption)
 *   - Equity-oriented STCG (held ≤ 12 mo): 20%
 *   - Debt-oriented (bought on/after 1-Apr-2023): taxed at the investor's slab (cannot compute here)
 *   - ELSS: 3-year lock-in PER installment — locked units cannot be redeemed
 *
 * Everything is an ESTIMATE and is flagged "confirm with your CA". This is
 * informational tax surfacing, NOT tax advice. Trustner is an AMFI MFD
 * (ARN-286886) — no "advisor/advisory" terminology.
 */

const LTCG_RATE = 0.125;        // equity LTCG 12.5%
const STCG_RATE = 0.20;         // equity STCG 20%
const LTCG_EXEMPTION_INR = 125_000; // ₹1.25 lakh per financial year (aggregate, equity LTCG)
const ELSS_LOCKIN_MONTHS = 36;

// Which sub-category keys are equity-oriented for tax purposes.
const EQUITY_KEYS = new Set([
  'small_cap', 'mid_cap', 'large_mid', 'large_cap', 'flexi', 'multi_cap', 'value',
  'focused', 'thematic', 'index', 'aggressive_hybrid', 'baf', 'multi_asset', 'equity_savings', 'other_equity',
]);
const DEBT_KEYS = new Set(['debt', 'conservative_hybrid']);

export interface ExitTaxInput {
  holdingId: number;
  fundName: string;
  subKey: string;                 // from subCategoryKey()
  investedInr: number;
  currentValueInr: number;
  holdingPeriodMonths: number | null;
  recommendedExit: boolean;       // true when the v2 action is a sell (switch/exit/reduce/redeem)
}

export interface ExitTaxLine {
  holdingId: number;
  fundName: string;
  gainInr: number;
  gainType: 'LTCG' | 'STCG' | 'SLAB' | 'LOSS' | 'NA';
  locked: boolean;
  estTaxInr: number | null;       // null when not computable (LTCG handled at portfolio level / debt slab / locked)
  note: string;
}

export interface ExitTaxSummary {
  lines: ExitTaxLine[];
  exitCount: number;
  totalGainInr: number;
  ltcgGainInr: number;
  stcgGainInr: number;
  ltcgExemptionUsedInr: number;
  estTotalTaxInr: number;
  hasLockedElss: boolean;
  hasDebtSlab: boolean;
  headline: string;
}

const inr = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

function taxBucket(subKey: string): 'equity' | 'debt' | 'elss' {
  if (subKey === 'elss') return 'elss';
  if (DEBT_KEYS.has(subKey)) return 'debt';
  if (EQUITY_KEYS.has(subKey)) return 'equity';
  return 'equity'; // default-assume equity-oriented (flagged in note)
}

/**
 * Estimate the tax impact of the recommended exits.
 * Pass ALL holdings; only those with recommendedExit=true are taxed, but the
 * ₹1.25L LTCG exemption is applied across the aggregate equity LTCG realised.
 */
export function estimateExitTax(inputs: ExitTaxInput[]): ExitTaxSummary {
  const exits = inputs.filter((i) => i.recommendedExit);
  const lines: ExitTaxLine[] = [];
  let ltcgGain = 0, stcgGain = 0, totalGain = 0;
  let hasLockedElss = false, hasDebtSlab = false;

  for (const i of exits) {
    const gain = Math.round((i.currentValueInr || 0) - (i.investedInr || 0));
    const months = i.holdingPeriodMonths ?? null;
    const bucket = taxBucket(i.subKey);

    // ELSS lock-in check first
    if (bucket === 'elss' && months != null && months < ELSS_LOCKIN_MONTHS) {
      hasLockedElss = true;
      const left = ELSS_LOCKIN_MONTHS - months;
      lines.push({ holdingId: i.holdingId, fundName: i.fundName, gainInr: gain, gainType: 'NA', locked: true,
        estTaxInr: null, note: `ELSS units still locked — ~${left} more month${left !== 1 ? 's' : ''} to the 3-year lock-in. Cannot redeem yet; defer this switch.` });
      continue;
    }

    if (gain <= 0) {
      lines.push({ holdingId: i.holdingId, fundName: i.fundName, gainInr: gain, gainType: 'LOSS', locked: false,
        estTaxInr: 0, note: gain < 0 ? `No tax — sitting on a ${inr(gain)} loss you can set off against other gains.` : 'No gain, no tax on exit.' });
      continue;
    }

    totalGain += gain;

    if (bucket === 'debt') {
      hasDebtSlab = true;
      lines.push({ holdingId: i.holdingId, fundName: i.fundName, gainInr: gain, gainType: 'SLAB', locked: false,
        estTaxInr: null, note: `Debt-oriented — the ${inr(gain)} gain is added to income and taxed at your slab (post-Apr-2023 rule). Estimate with your CA.` });
      continue;
    }

    // equity / unlocked ELSS
    const isLtcg = months != null ? months > 12 : true; // default to LTCG if unknown (conservative)
    if (isLtcg) {
      ltcgGain += gain;
      lines.push({ holdingId: i.holdingId, fundName: i.fundName, gainInr: gain, gainType: 'LTCG', locked: false,
        estTaxInr: null, note: `Long-term gain of ${inr(gain)} — taxed at 12.5% above the shared ₹1.25L/yr exemption.${months == null ? ' (Holding period unconfirmed — assumed long-term.)' : ''}` });
    } else {
      stcgGain += gain;
      const tax = Math.round(gain * STCG_RATE);
      lines.push({ holdingId: i.holdingId, fundName: i.fundName, gainInr: gain, gainType: 'STCG', locked: false,
        estTaxInr: tax, note: `Short-term gain of ${inr(gain)} — taxed at 20% (≈${inr(tax)}). Holding ~${months} mo; waiting past 12 mo would cut this to 12.5% LTCG and may avoid exit load.` });
    }
  }

  // Apply the ₹1.25L LTCG exemption across the aggregate equity LTCG realised.
  const ltcgExemptionUsed = Math.min(ltcgGain, LTCG_EXEMPTION_INR);
  const ltcgTaxable = Math.max(0, ltcgGain - LTCG_EXEMPTION_INR);
  const ltcgTax = Math.round(ltcgTaxable * LTCG_RATE);
  const stcgTax = Math.round(stcgGain * STCG_RATE);
  const estTotalTax = ltcgTax + stcgTax;

  const parts: string[] = [];
  if (ltcgGain > 0) parts.push(`${inr(ltcgGain)} LTCG (₹1.25L exempt → ~${inr(ltcgTax)} @12.5%)`);
  if (stcgGain > 0) parts.push(`${inr(stcgGain)} STCG (~${inr(stcgTax)} @20%)`);
  const headline = exits.length === 0
    ? 'No exits recommended — no tax to plan.'
    : estTotalTax > 0
      ? `Acting on ${exits.length} exit${exits.length !== 1 ? 's' : ''} realises ${inr(totalGain)} of gains → est. ~${inr(estTotalTax)} tax${parts.length ? ' (' + parts.join('; ') + ')' : ''}. Phase across financial years to use each year's ₹1.25L exemption.`
      : `Acting on ${exits.length} exit${exits.length !== 1 ? 's' : ''} realises ${inr(totalGain)} of gains — within the ₹1.25L LTCG exemption, so ~₹0 tax this year.${hasDebtSlab ? ' (Debt gains taxed at slab — confirm with CA.)' : ''}`;

  return {
    lines, exitCount: exits.length,
    totalGainInr: totalGain, ltcgGainInr: ltcgGain, stcgGainInr: stcgGain,
    ltcgExemptionUsedInr: ltcgExemptionUsed, estTotalTaxInr: estTotalTax,
    hasLockedElss, hasDebtSlab, headline,
  };
}
