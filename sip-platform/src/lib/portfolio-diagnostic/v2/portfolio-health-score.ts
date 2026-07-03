/**
 * Trustner Verdict Engine v2 — PORTFOLIO HEALTH SCORE
 * =====================================================
 * A single top-line 0-100 number that rolls up signals the engine already
 * computes: how much of the money sits in approved-quality holdings (55%),
 * whether carried risk matches the client's tolerated ceiling (20%), how much
 * value is trapped in overlapping duplicate funds (15%), and whether past
 * investor behaviour has been leaking returns to bad timing (10%).
 *
 * This is deliberately NOT the client's capacity/tolerance score — those
 * describe the CLIENT (risk-model.ts), not the portfolio. A conservative
 * client whose book correctly matches their profile should score just as
 * well as an aggressive client whose book correctly matches theirs. This
 * score answers "how good is THIS portfolio, for THIS client" — not "how
 * much risk can/will this client take".
 *
 * Built for REEDOS-parity (competitor's S.M.A.R.T tool shows a single 0-100
 * "Existing Portfolio Score" gauge) while keeping Trustner's per-holding
 * transparency underneath — this is a rollup, not a replacement.
 */

export type HealthBand = 'red' | 'orange' | 'yellow' | 'green';

export interface PortfolioHealthInputs {
  tierTotals: {
    star: { pctOfPortfolio: number };
    keep: { pctOfPortfolio: number };
    watch: { pctOfPortfolio: number };
    swap: { pctOfPortfolio: number };
    liquidate: { pctOfPortfolio: number };
  };
  riskGap: { hasGap: boolean; pctAboveCeiling: number } | null;
  consolidationValueInr: number;
  currentValueInr: number;
  behaviourGap: { gapPp: number } | null;
}

export interface PortfolioHealthScore {
  score: number;                  // 0-100, rounded
  band: HealthBand;
  bandLabel: string;
  components: {
    verdictQuality: number;       // 0-100 — value-weighted verdict mix
    riskAlignment: number;        // 0-100 — carried vs tolerated risk tier
    consolidationEfficiency: number; // 0-100 — inverse of overlap/duplication
    behaviourDiscipline: number;  // 0-100 — inverse of the timing/behaviour gap
  };
  rationale: string[];
}

// Value-weighted "quality points" per verdict tier — STAR/KEEP are healthy,
// SWAP/LIQUIDATE mean money is sitting somewhere the engine wants it moved.
const VERDICT_TIER_POINTS = { star: 100, keep: 82, watch: 58, swap: 32, liquidate: 10 } as const;

export function computePortfolioHealthScore(i: PortfolioHealthInputs): PortfolioHealthScore {
  const rationale: string[] = [];

  // 1) Verdict Quality (55%) — value-weighted tier mix
  const t = i.tierTotals;
  const verdictQuality = Math.round(
    (t.star.pctOfPortfolio * VERDICT_TIER_POINTS.star +
      t.keep.pctOfPortfolio * VERDICT_TIER_POINTS.keep +
      t.watch.pctOfPortfolio * VERDICT_TIER_POINTS.watch +
      t.swap.pctOfPortfolio * VERDICT_TIER_POINTS.swap +
      t.liquidate.pctOfPortfolio * VERDICT_TIER_POINTS.liquidate) /
      100
  );
  const starKeepPct = Math.round(t.star.pctOfPortfolio + t.keep.pctOfPortfolio);
  rationale.push(`${starKeepPct}% of the book sits in STAR/KEEP-tier holdings`);

  // 2) Risk Alignment (20%) — carried risk vs the client's tolerated ceiling
  let riskAlignment: number;
  if (!i.riskGap) {
    riskAlignment = 70; // no risk profile captured — neutral, not rewarded/penalised
    rationale.push('Risk profile not yet captured — alignment component held neutral');
  } else if (i.riskGap.hasGap) {
    riskAlignment = Math.max(35, 100 - i.riskGap.pctAboveCeiling * 1.2);
    rationale.push(`${i.riskGap.pctAboveCeiling}% of the equity sleeve runs above the client's risk ceiling`);
  } else {
    riskAlignment = 100;
    rationale.push("Carried risk matches the client's tolerated ceiling");
  }

  // 3) Consolidation Efficiency (15%) — value trapped in overlapping duplicates
  const overlapPct = i.currentValueInr > 0 ? (i.consolidationValueInr / i.currentValueInr) * 100 : 0;
  const consolidationEfficiency = Math.max(50, Math.round(100 - Math.min(50, overlapPct * 2)));
  if (overlapPct > 5) rationale.push(`${Math.round(overlapPct)}% of value sits in overlapping duplicate funds`);

  // 4) Behaviour Discipline (10%) — has past timing leaked return vs the funds held?
  let behaviourDiscipline = 100;
  if (i.behaviourGap && i.behaviourGap.gapPp > 0) {
    behaviourDiscipline = Math.max(40, Math.round(100 - i.behaviourGap.gapPp * 6));
    rationale.push(`Past timing has cost ~${i.behaviourGap.gapPp.toFixed(1)}pp/yr vs the funds' own returns`);
  }

  const raw =
    verdictQuality * 0.55 + riskAlignment * 0.2 + consolidationEfficiency * 0.15 + behaviourDiscipline * 0.1;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const band: HealthBand = score < 40 ? 'red' : score < 60 ? 'orange' : score < 75 ? 'yellow' : 'green';
  const bandLabel = { red: 'Needs Attention', orange: 'Below Par', yellow: 'Fair', green: 'Healthy' }[band];

  return {
    score,
    band,
    bandLabel,
    components: {
      verdictQuality,
      riskAlignment: Math.round(riskAlignment),
      consolidationEfficiency,
      behaviourDiscipline,
    },
    rationale,
  };
}

const BAND_HEX: Record<HealthBand, string> = {
  red: '#DC2626',
  orange: '#EA580C',
  yellow: '#CA8A04',
  green: '#16A34A',
};

/**
 * Render a REEDOS-style semicircle speedometer gauge as a self-contained
 * inline SVG string (no external assets — safe for HTML/PDF/DOCX-embedded
 * reports). Bands: 0-40 red, 40-60 orange, 60-75 yellow, 75-100 green.
 */
export function renderHealthGaugeSvg(h: PortfolioHealthScore, opts?: { size?: number }): string {
  const size = opts?.size ?? 200;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size / 2 - 22;
  const toXY = (pct: number) => {
    const a = (Math.PI / 180) * (180 - (pct / 100) * 180);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };
  const arc = (from: number, to: number, color: string) => {
    const p0 = toXY(from);
    const p1 = toXY(to);
    return `<path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" stroke="${color}" stroke-width="16" fill="none" stroke-linecap="butt"/>`;
  };
  const needle = toXY(h.score);
  const needleInner = { x: cx + (needle.x - cx) * 0.06, y: cy + (needle.y - cy) * 0.06 };
  const bandColor = BAND_HEX[h.band];

  return `<svg viewBox="0 0 ${size} ${Math.round(size * 0.62)}" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:${size}px; display:block; margin:0 auto;">
    ${arc(0, 40, BAND_HEX.red)}
    ${arc(40, 60, BAND_HEX.orange)}
    ${arc(60, 75, BAND_HEX.yellow)}
    ${arc(75, 100, BAND_HEX.green)}
    <line x1="${needleInner.x.toFixed(1)}" y1="${needleInner.y.toFixed(1)}" x2="${needle.x.toFixed(1)}" y2="${needle.y.toFixed(1)}" stroke="#15233B" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="5.5" fill="#15233B"/>
    <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="24" font-weight="700" fill="${bandColor}" font-family="Helvetica Neue, Arial, sans-serif">${h.score}</text>
    <text x="${cx}" y="${cy + 45}" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="0.5" fill="#64748B" font-family="Helvetica Neue, Arial, sans-serif">${h.bandLabel.toUpperCase()}</text>
  </svg>`;
}
