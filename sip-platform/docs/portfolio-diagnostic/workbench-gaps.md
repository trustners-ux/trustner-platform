# Workbench Gaps vs Canonical Output

Comparison of today's Portfolio Diagnostic Workbench against the canonical reference (`canonical-dipankar-das.md`). Each gap below has a concrete fix spec.

## Status Matrix

| # | Canonical Section | Workbench Today | Status | Effort | Priority |
|---:|---|---|---|---|---|
| A | Family Snapshot | Partial — has AUM, segment, age. Missing inferred risk profile + life-stage tag | 🟡 | S | P1 |
| B | Asset Allocation Diagnostic vs Targets | **Missing** — no target-allocation table by age/risk | 🔴 | M | P0 |
| C | Per-Holding Verdicts | ✅ Already built — deterministic scoring engine produces this | 🟢 | — | — |
| D | Proposed Restructured Portfolio | **Missing** — no proposer module | 🔴 | L | P1 |
| E | Tax Impact Summary | **Missing** — no STCG/LTCG calculator on swap actions | 🔴 | M | P0 |
| F | SIP Rationalization Plan | **Missing** — no SIP keeper/stopper logic | 🔴 | M | P1 |
| G | Critical Gaps (goals, emergency fund, insurance) | **Missing** — narrative doesn't flag suitability gaps | 🔴 | M | P2 |
| H | Workflow Routing | ✅ Built — auto-routes by AUM segment + certification | 🟢 | — | — |
| I | Methodology Footer | ✅ Built — Section 10.1 of spec | 🟢 | — | — |

## P0 — Data Plumbing (must be in place before ANY of the gap-closes ship value)

### Gap 1: `pd_fund_master` is empty
**Symptom**: Workbench can't auto-categorize or score Dipankar's 15 holdings.
**Fix**: Build AMFI NAV ingestion cron.
- Source: `https://portal.amfiindia.com/spages/NAVAll.txt` (free, daily)
- Schema additions to `pd_fund_master`:
  - `nav_1d`, `nav_1m`, `nav_3m`, `nav_6m`, `nav_1y` snapshots
  - `cagr_3y`, `cagr_5y`, `cagr_10y` (computed from NAV history)
  - `manager_name`, `manager_tenure_months`
  - `aum_inr`, `expense_ratio`
- Cron path: `src/app/api/cron/amfi-nav/route.ts`, Vercel cron at 09:00 IST daily
- Backfill: one-time script pulls NAV history from MFAPI.in (`api.mfapi.in/mf/<scheme_code>`)

### Gap 2: `pd_category_benchmarks` is empty
**Symptom**: Verdicts compute against median of ~0 funds → meaningless scores.
**Fix**: Seed monthly snapshots of category medians per fund category.
- Computed from `pd_fund_master.cagr_3y` / `cagr_5y` aggregated by category
- Index benchmarks: Nifty 50 TRI, Nifty 500 TRI, Nifty Midcap 150 TRI, Nifty Smallcap 250 TRI, CRISIL Hybrid 50+50 (manual ingest from NSE/CRISIL)

### Gap 3: `pd_preferred_funds_by_category` has 12 placeholders
**Symptom**: SWAP verdicts have no target scheme to recommend.
**Fix**: Curate from internal list + cross-validate.
- Ram's internal list goes in as `priority=1`
- My cross-check (from canonical analysis): PPFAS Flexi, Motilal L&M, Invesco Mid Cap, Nippon Multi Cap, Bandhan SC, ICICI Pru E&D, HDFC Short Term Debt — all as `priority=2` for diff-review
- Add columns: `min_aum_inr_eligible`, `max_aum_inr_eligible`, `client_segment` so HNI/UHNI can have different preferred lists

## P0 — Tax Engine (legal accuracy)

### Gap 4: Tax impact calculator missing
**Symptom**: Reviewer must compute STCG/LTCG by hand for every SWAP.
**Fix**: Add `src/lib/portfolio-diagnostic/tax-engine.ts`:
```ts
computeTaxOnSwap(holding: AnalyzedHolding, swapDate: Date): {
  classification: 'STCG' | 'LTCG';
  gainLoss: number;
  exemptionRemaining: number; // ₹1.25L LTCG annual ceiling
  estimatedTax: number;
  taxFree: boolean;
}
```
- Track running LTCG used per family per FY (new column `pd_diagnostic_runs.ltcg_used_this_fy`)
- Use Finance Act 2024 rates: STCG 20%, LTCG 12.5% above ₹1.25L exemption
- Section 80C eligibility (ELSS lock-in) — flag if user tries to swap pre-3yr lock-in

## P1 — Allocation Target Engine

### Gap 5: No age × risk × segment → target allocation matrix
**Symptom**: Section B of canonical analysis is hand-derived. Workbench can't auto-produce.
**Fix**: New table `pd_allocation_targets`:
```sql
CREATE TABLE pd_allocation_targets (
  age_band_min INT,
  age_band_max INT,
  risk_profile pd_risk_profile, -- new enum: conservative, moderate, aggressive
  asset_class TEXT, -- equity, hybrid, debt
  sub_class TEXT, -- flexi_cap, large_mid, mid, multi, small, ultra_short, short_duration
  target_pct NUMERIC(5,2),
  tolerance_pct NUMERIC(5,2) -- ±band before flagging
);
```
- Seed for 6 age bands × 3 risk profiles × 8 sub-classes = 144 rows
- Use this in narrative to auto-fill the allocation gap table

## P1 — Restructure Proposer Module

### Gap 6: No "proposed portfolio" generator
**Symptom**: Section D (the 15→7 restructure) is the highest-value reviewer output but Workbench doesn't produce it.
**Fix**: New module `src/lib/portfolio-diagnostic/restructure-proposer.ts`:
- Input: AnalyzedHolding[] + target allocation matrix + tax constraints + preferred funds list
- Output: ProposedPortfolio { keepers, swaps, exits, new_buys, monthly_sip_plan }
- Algorithm:
  1. Group existing holdings by category
  2. Within each category, rank by verdict score; keep top-1 (or top-2 for AUM > ₹50L)
  3. For SWAP candidates, look up preferred-funds list and propose target scheme
  4. Run tax-engine on each swap; defer swaps that would breach LTCG exemption
  5. Compute final allocation; flag categories still over/under target
- New table: `pd_diagnostic_proposals` (one row per DiagnosticRun)

## P1 — SIP Rationalization

### Gap 7: No SIP keeper/stopper logic
**Symptom**: 10 SIPs become 5 by hand-curation.
**Fix**: Extend restructure-proposer:
- For each holding marked KEEP/STAR with category alloc within tolerance: SIP continues
- For SWAP/LIQUIDATE: SIP stops, monthly rupees route to category keeper
- Output: `sip_action_plan: Array<{ scheme, action: 'continue'|'stop'|'redirect_to', current_amount, new_amount }>`

## P1 — Narrative Generator Upgrade

### Gap 8: Claude narrative is per-holding only
**Symptom**: Sections A, B, G (family-level) absent from output.
**Fix**: Extend `claude-narrative.ts` with new top-level functions:
- `buildFamilyExecutiveSummary(family, holdings, scoring)` → 1-paragraph headline + 3-issue bullet list
- `buildAllocationDiagnostic(family, holdings, targets)` → table with current/target/gap
- `buildClientGapsFlag(family, holdings)` → emergency fund / goals / insurance / glide-path flags

## P2 — Inheritance / ARN-Tracking

### Gap 9: ARN tag (transferred-in vs originated) not in `pd_diagnostic_holdings`
**Symptom**: Can't filter "transferred-in book" for special treatment.
**Fix**: Add `originating_arn TEXT, is_transferred_in BOOLEAN` to `pd_diagnostic_holdings`.
- CAS parser already sees the dual ARN tag (e.g. `ARN-140124,286886`) — wire it through.

## P2 — Client-Facing Report PDF

### Gap 10: jsPDF report doesn't render sections A-I
**Symptom**: Even if Workbench computes A-I, the client-facing PDF only has C.
**Fix**: Extend `src/lib/utils/portfolio-pdf.ts`:
- Cover page with family summary
- Allocation donut + gap bar chart (use chart.js → canvas → image)
- Verdict table with verdict-color chips (STAR/KEEP/etc)
- Restructure summary slide
- Tax impact table
- Methodology footer + ARN-286886 disclaimer

---

## Recommended Sprint Plan (3 weeks to MVP-2.0)

### Sprint 1 — Data Layer (4 days)
- AMFI NAV ingestion cron + backfill
- Seed `pd_fund_master` (150 schemes), `pd_category_benchmarks` (8 categories)
- Curate `pd_preferred_funds_by_category` (cross-validate Ram's list vs canonical analysis)
- Add `pd_allocation_targets` schema + seed 144 rows

### Sprint 2 — Engine Upgrades (5 days)
- Tax engine
- Restructure proposer module
- SIP rationalization logic
- Allocation diagnostic computation

### Sprint 3 — Narrative + PDF (5 days)
- Family-level Claude narrative functions
- Client-gaps flagger
- Client-facing PDF renderer (sections A-I)

### Sprint 4 — End-to-End Validation (2 days)
- Run Dipankar Das CAS through Workbench end-to-end
- Compare auto-output to `canonical-dipankar-das.md`
- Tune until match-rate >85%

### Sprint 5 — Pilot (1 week)
- Pick 20 client families across segments (5 Mass, 10 Affluent, 5 HNI)
- Run all through Workbench
- Ram + Sangita review and approve/amend
- Capture override rate per section — feeds the learning loop

---

## Learning Loop (post-pilot)

After 20-50 reviewed diagnostics, add:

| Metric | Captured From | Use |
|---|---|---|
| Section override frequency | reviewer edits to draft | flag which sections need narrative tuning |
| Verdict override rate | reviewer changes STAR/KEEP/etc | tune scoring weights |
| Restructure approval rate | accepted vs rejected proposals | tune proposer constraints |
| Time-to-approval | per-diagnostic stopwatch | measure reviewer leverage |

Goal: when override rate drops below 10% per section, that section can auto-publish for **routine** cases (Mass + low-complexity Affluent), with L4+ review only for exception-flagged cases.

This is the path to "approve with one click" you described.
