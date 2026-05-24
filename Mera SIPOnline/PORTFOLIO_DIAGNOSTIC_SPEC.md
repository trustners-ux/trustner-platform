# Portfolio Diagnostic — Product Specification

**Product:** Trustner Advisory Workbench (internal employee tool, accessed at `merasip.com/admin/portfolio-diagnostic`)
**Owner:** Ram Shah, CFP™ | Trustner Asset Services Pvt. Ltd. | ARN-286886
**Spec Version:** v2.0 (Workflow Edition) | Date: 23 May 2026
**Engineering Lead:** TBD

---

## 0. REVISION HISTORY

**v2.0 (23 May 2026)** — Pivot from public self-service to internal employee tool with role-based review hierarchy. Added: SIP capture, sort/filter, 5-level role model, multi-stage workflow with approval gate, PDF generation conditional on approval. The public-facing version becomes a Phase 4 derivative.

**v1.0 (23 May 2026)** — Initial public-facing product design.

---

## 1. PRODUCT MISSION

Give every Indian mutual-fund investor a **CFP-grade, category-benchmarked diagnostic of their portfolio in under 5 minutes**, for free.

The diagnostic produces three institutional-quality PDF deliverables (Diagnostic Report, Full Portfolio Review, Action Sheet) that would normally cost ₹15,000-50,000 from a fee-based RIA. We give it free as a Trustner lead-magnet — and convert the visible value into trail-commission AUM by inviting users to onboard.

The methodology is the same one we apply to existing Trustner clients (see `Rohit Jain Family May 2026/` package). The web version is a software-ised version of that workflow.

---

## 1.5 ROLE-BASED ACCESS MODEL (v2.0)

The Workbench has five role levels. Each role has explicit permissions and an approval-authority ceiling tied to client AUM:

| Level | Role | Upload | Edit Draft | Review | Approve | Publish | AUM Ceiling | Examples |
|---|---|---|---|---|---|---|---|---|
| **L1** | Trainee | ❌ | ❌ | ❌ | ❌ | ❌ | — | New hires (read-only) |
| **L2** | Junior Analyst | ✅ | ✅ | ❌ | ❌ | ❌ | — | Data-entry staff |
| **L3** | Mid Reviewer | ✅ | ✅ | ✅ | ✅ | ❌ | ₹50 Lakh | NISM-VA certified |
| **L4** | Senior Reviewer | ✅ | ✅ | ✅ | ✅ | ✅ | ₹5 Crore | CFP / CFA-L3 |
| **L5** | Owner / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | Unlimited | Ram Shah, CFP™ |

### Segment-based certification gates

Beyond AUM ceiling, certain client segments require specific certifications:

| Segment | Required Cert | Why |
|---|---|---|
| Mass (< ₹10 L) | NISM-V-A | Standard MFD competency |
| Affluent (₹10 L - ₹50 L) | NISM-V-A | Standard MFD competency |
| HNI (₹50 L - ₹5 Cr) | CFP, CFA-L3, or NISM-VA-Investment-Adviser | Higher complexity, multi-PAN |
| UHNI (> ₹5 Cr) | CFP or CFA-L3 + L5 admin sign-off | Estate planning + cross-entity tax |

### Workflow State Machine

```
   DRAFT ──submit──► SUBMITTED ──assign──► IN_REVIEW
     ▲                                        │
     │ request_changes                        ├──► CHANGES_REQUESTED ──► DRAFT
     │                                        │
     │                                        ├──► ESCALATED (AUM > ceiling)
     │                                        │      │
     │                                        │      ├──► APPROVED
     │                                        │      │      │
     │                                        ├──────┘      │
     │                                        │             ▼
     │                                        ▼      ╔═════════════╗
     │                                  APPROVED ───►║  PUBLISHED  ║
     │                                               ║  (PDFs)     ║
     │                                               ╚═════════════╝
     │
     └── REJECTED (terminal) | ARCHIVED (post-publish admin action)
```

**Critical rule:** PDFs are generated ONLY on the `APPROVED → PUBLISHED` transition. Draft and review states never produce client-facing artefacts.

---

## 1.6 SIP CAPTURE (v2.0)

The earlier (v1.0) spec captured only current holdings. v2.0 adds parallel capture of **active SIP commitments**, which are essential for:

1. **J-curve diagnosis** — SIP age is our primary "is this really underperforming?" test
2. **Forward cash-flow projection** — 5-year wealth math needs monthly SIP inflow assumption
3. **Step-up planning** — annual step-up SIPs change the math materially
4. **SIP redirection on SWAP** — when a fund is SWAPped, the SIP must be redirected too

### Per-SIP data captured

| Field | Why captured |
|---|---|
| `entityName` (PAN) | Multi-PAN families have SIPs across entities |
| `fundName` + `amfiCode` | Links to fund master for verdict |
| `actualAmountInr` + `frequency` (Monthly/Quarterly/Weekly/Daily) | Normalised to monthly-equivalent for comparison |
| `sipDayOfMonth` (1-28) | Affects NAV timing in rupee-cost averaging |
| `startDate`, `endDate` | Determines J-curve phase; perpetual vs fixed-term |
| `hasStepUp` + `stepUpPct` + `stepUpFrequency` | Affects 5-year inflow projection |
| `installmentsCompleted` / `totalInstallments` | Tracks progress to goal-based SIPs |
| `nextInstallmentDate` | Used to flag mandate failures |
| `bankMandateStatus` | Active / Inactive / Pending |

### SIP-level recommended action

Each SIP gets an action recommendation derived from its underlying fund's verdict:

| Fund Verdict | SIP Recommended Action |
|---|---|
| STAR | Continue |
| KEEP | Continue |
| WATCH | Continue |
| SWAP | **Re-direct** — Stop SIP in current fund, start new SIP in replacement |
| LIQUIDATE | **Stop** — discontinue the SIP entirely |

### Family-level SIP aggregates (shown on every Diagnostic Report)

- Total active SIPs (count)
- Total monthly SIP outflow (₹)
- Total annual SIP outflow (₹)
- Projected 5-year SIP inflow (with step-up applied)
- SIP flow by category (small-cap, mid-cap, hybrid, etc.)
- SIP flow by entity (which PAN funds the most)
- # SIPs requiring redirect
- # SIPs requiring stop

---

## 1.7 SORT & FILTER (v2.0)

Every table in the Workbench supports column-level sorting and multi-criterion filtering:

### Holdings table — sortable columns

| Field | Default Direction | Notes |
|---|---|---|
| Fund Name | asc | Alphabetical |
| Category | asc | Small Cap, Mid Cap, etc. |
| Entity | asc | PAN holder |
| Invested ₹ | desc | Largest first |
| Current Value ₹ | desc | |
| Unrealised Gain ₹ | desc | |
| XIRR % | desc | |
| 3Y CAGR % | desc | |
| 5Y CAGR % | desc | |
| Category Quartile | asc | Q1 first |
| Composite Score | desc | Best first |
| **Verdict** | asc | **STAR → KEEP → WATCH → SWAP → LIQUIDATE** (custom order) |
| Holding Period (months) | desc | Oldest first |

### SIP table — sortable columns

| Field | Default Direction |
|---|---|
| Fund Name | asc |
| Entity | asc |
| Monthly Amount ₹ | desc |
| Start Date | asc (oldest first) |
| Age in Months | desc |
| Status (Active/Paused) | asc |
| Next Installment Date | asc |
| Expected 5Y Inflow ₹ | desc |

### Filter criteria (apply to both holdings and SIPs)

- By Verdict (multi-select): STAR, KEEP, WATCH, SWAP, LIQUIDATE
- By Category (multi-select)
- By Entity (multi-select)
- By Entity Type (Individual / Corporate)
- By min/max Invested ₹
- "Only Active SIPs" toggle

### Default view (when reviewer first opens a diagnostic)

- Holdings: sorted by `Verdict ASC → Current Value DESC` (showing STARs at top, biggest holdings within each verdict)
- SIPs: sorted by `Monthly Amount DESC → Start Date ASC` (biggest SIPs first, then oldest)

---

## 2. EMPLOYEE JOURNEY (Workbench v2.0)

### Flow Overview

1. **Login** — `merasip.com/admin/login` (existing auth) → role-based dashboard
2. **Dashboard** — three queues: My Drafts / Awaiting Me / Published. New-Diagnostic button.
3. **Create** (L2+) — link or create Client Family → upload CAS / manual entry → enter SIP details (separate tab) → save draft (auto-save every 30 sec)
4. **Confirm** (L2) — sortable holdings + SIP tables → "Run Preliminary Analysis" (scoring engine fires)
5. **Submit** (L2) — system auto-assigns reviewer based on (a) L2's reporting manager, (b) family AUM vs ceiling, (c) required certification → `DRAFT → SUBMITTED → IN_REVIEW`
6. **Review** (L3/L4) — full sortable view + verdict overrides (with justification) + per-holding comments + replacement-fund edits → Approve / Request Changes / Escalate / Reject
7. **Auto-escalate** — if family AUM > reviewer's ceiling, system re-routes to L4 (L3 keeps audit-trail visibility)
8. **Approve** (L4/L5) — `APPROVED` (no PDFs yet)
9. **Publish** (L4/L5) — single click → PDF generation pipeline fires → 4 PDFs created → email + WhatsApp queued → `PUBLISHED`

### Notification Rules

| Event | Notified | Channel |
|---|---|---|
| Diagnostic SUBMITTED | Assigned reviewer | Email + in-app |
| Review pending > 24h | Reviewer + their manager | Email |
| Review pending > 48h | Original uploader + admin | Email |
| ESCALATED | New L4 reviewer + original L3 | Email + in-app |
| CHANGES_REQUESTED | Original uploader | Email + in-app + comment thread |
| APPROVED | All workflow participants | Email |
| PUBLISHED | Original uploader + RM + admin | Email + in-app |
| Diagnostic stuck > 72h in any state | Admin | Daily digest email |

### SLA Targets

| Stage | Target | Hard cap |
|---|---|---|
| L2 draft → submit | < 2 h active work | 5 days idle |
| Reviewer auto-assignment | < 5 min | 1 h (admin alert if blocked) |
| L3 review → action | < 24 h | 48 h triggers escalation |
| L4 escalation → action | < 24 h | 48 h |
| Approved → published | < 1 h (single click) | Same day |
| Published → email sent | < 5 min (queue) | 30 min |

---

## 2A. PUBLIC PHASE 4 JOURNEY (deferred, after internal MVP)

The original public-facing journey (CAS upload → free diagnostic) becomes a Phase 4 derivative once the internal Workbench is proven. The output it produces will be the same set of PDFs, but with an "auto-generated" badge that the client can convert to a Trustner-reviewed version by booking a consultation.

```text
(Original v1.0 journey deferred — see legacy diagram below)

┌──────────────────────────────────────────────────────────────────┐
│  LAND ON /portfolio-diagnostic (public)                          │
│  → Hero: "Get Your Free CFP-Grade Portfolio Diagnostic"          │
│  → Sample report screenshot + 3 testimonials                     │
│  → CTA: "Start My Diagnostic (90 seconds)"                       │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — UPLOAD CAS PDF OR ENTER MANUALLY                       │
│  • Option A: Upload Karvy/CAMS CAS PDF (password = PAN by default)│
│  • Option B: Manual entry (fund name + units + invest date)       │
│  • Option C: Connect Karvy MFS (Phase 2)                          │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — CONFIRM HOLDINGS                                       │
│  Auto-parsed holdings shown in a table for user to verify         │
│  → "Looks right? Click 'Run Diagnostic'"                          │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — ENTER CONTACT DETAILS (LEAD CAPTURE)                   │
│  • Name (req)  • Email (req)  • Mobile (req for WhatsApp)         │
│  • PAN (optional, for tax personalisation)                         │
│  • Risk profile + horizon (3 quick questions)                      │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — PROCESSING (15-30 seconds with progress bar)            │
│  → Fund-data lookup → Scoring → Narrative → PDF generation        │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5 — RESULT PAGE                                            │
│  • Verdict summary (X Keep / Y Swap / Z Liquidate)                │
│  • 3 PDFs downloadable + emailed                                   │
│  • CTA: "Book free 30-min consultation with our CFP"               │
│  • Save: Login link for quarterly auto-refresh                     │
└──────────────────────────────────────────────────────────────────┘
```

*Phase 4 design will be detailed once the internal workbench has shipped and we have proven the methodology with 50+ supervised reviews.*

---

## 3. SYSTEM ARCHITECTURE

### 3.1 Tech Stack (re-use existing merasip.com infrastructure)

| Layer | Tech | Already in stack? |
|---|---|---|
| Frontend | Next.js 15 + React 19 + Tailwind | ✅ Yes |
| Backend | Next.js API routes | ✅ Yes |
| Database | Supabase (Postgres) | ✅ Yes |
| File storage | Vercel Blob | ✅ Yes |
| AI / LLM | Anthropic Claude (`@anthropic-ai/sdk`) | ✅ Yes |
| Email | Resend | ✅ Yes |
| PDF generation | `pdfkit` + `puppeteer` (new) | Partial (pdfkit yes; puppeteer new) |
| CAS PDF parsing | `pdf-parse` (new) | New |
| Auth | NextAuth (Phase 3) | Already set up |
| WhatsApp delivery (Phase 2) | Gupshup API | New |

### 3.2 Directory Structure (merasip.com)

```
sip-platform/
├── src/
│   ├── app/
│   │   ├── portfolio-diagnostic/
│   │   │   ├── page.tsx              ← Landing page
│   │   │   ├── upload/page.tsx       ← Step 1
│   │   │   ├── confirm/page.tsx      ← Step 2
│   │   │   ├── lead/page.tsx         ← Step 3
│   │   │   ├── processing/page.tsx   ← Step 4
│   │   │   └── result/[id]/page.tsx  ← Step 5
│   │   └── api/
│   │       └── portfolio-diagnostic/
│   │           ├── parse-cas/route.ts
│   │           ├── analyze/route.ts
│   │           ├── generate-pdf/route.ts
│   │           ├── email-report/route.ts
│   │           └── status/[id]/route.ts
│   ├── lib/
│   │   └── portfolio-diagnostic/
│   │       ├── types.ts                 ← TypeScript interfaces
│   │       ├── methodology.ts           ← 4-criterion weights
│   │       ├── scoring-engine.ts        ← Deterministic scoring
│   │       ├── fund-data-client.ts      ← MFAPI.in wrapper
│   │       ├── cas-parser.ts            ← PDF → structured holdings
│   │       ├── tax-calculator.ts        ← Capital gains logic
│   │       ├── replacement-recommender.ts ← For SWAPs
│   │       ├── narrative-generator.ts   ← Claude wrapper
│   │       └── report-templates/
│   │           ├── diagnostic-report.html  ← Doc 06 equivalent
│   │           ├── full-review.html        ← Doc 09 equivalent
│   │           └── action-sheet.html       ← Doc 07 equivalent
│   └── data/
│       └── portfolio-diagnostic/
│           ├── category-medians.ts      ← Fund category benchmarks
│           ├── preferred-funds.ts       ← Trustner-recommended swap targets
│           └── sample-holdings.ts       ← Test fixtures
└── supabase/
    └── migrations/
        └── 2026_portfolio_diagnostic_schema.sql
```

### 3.3 Database Schema (Supabase Postgres)

```sql
-- Diagnostic runs (one per user submission)
CREATE TABLE diagnostic_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id),     -- nullable if not logged in
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  pan TEXT,                              -- encrypted at rest
  risk_profile TEXT,
  horizon_years INT,
  status TEXT NOT NULL,                  -- 'parsing' | 'analyzing' | 'completed' | 'failed'
  source TEXT NOT NULL,                  -- 'cas-upload' | 'manual' | 'karvy-api'
  cas_blob_url TEXT,                     -- Vercel Blob URL of uploaded CAS
  family_aum_inr BIGINT,                 -- denormalised summary
  family_xirr_pct NUMERIC(5,2),
  num_holdings INT,
  num_swaps INT,                         -- after analysis
  num_liquidate INT,
  diagnostic_report_pdf_url TEXT,
  full_review_pdf_url TEXT,
  action_sheet_pdf_url TEXT,
  delivery_status JSONB                  -- {email: 'sent', whatsapp: 'pending'}
);

-- Individual holdings within a diagnostic run
CREATE TABLE diagnostic_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_run_id UUID REFERENCES diagnostic_runs(id) ON DELETE CASCADE,
  pan_or_entity TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  amfi_code TEXT,                        -- the ISIN/AMFI scheme code
  category TEXT,                         -- 'Small Cap', 'Mid Cap', etc.
  units NUMERIC(15,4),
  invested_inr BIGINT,
  current_value_inr BIGINT,
  unrealised_gain_inr BIGINT,
  xirr_pct NUMERIC(5,2),
  cagr_1y NUMERIC(5,2),
  cagr_3y NUMERIC(5,2),
  cagr_5y NUMERIC(5,2),
  category_median_3y NUMERIC(5,2),
  category_median_5y NUMERIC(5,2),
  category_quartile INT,                 -- 1 / 2 / 3 / 4
  manager_tenure_months INT,
  amc_stability_score NUMERIC(3,2),      -- 0.00 to 1.00
  composite_score NUMERIC(3,2),
  verdict TEXT,                          -- STAR / KEEP / WATCH / SWAP / LIQUIDATE
  verdict_rationale TEXT,
  recommended_replacement TEXT,          -- nullable; only for SWAP
  estimated_tax_impact_inr INT
);

-- Fund master table (refreshed weekly from MFAPI)
CREATE TABLE fund_master (
  amfi_code TEXT PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  amc_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  current_nav NUMERIC(10,4),
  aum_inr_cr NUMERIC(10,2),
  expense_ratio NUMERIC(4,2),
  fund_manager TEXT,
  manager_since_date DATE,
  cagr_1y NUMERIC(5,2),
  cagr_3y NUMERIC(5,2),
  cagr_5y NUMERIC(5,2),
  cagr_10y NUMERIC(5,2),
  category_rank_3y INT,
  category_rank_5y INT,
  category_total INT,                    -- e.g. 24 funds in small-cap
  last_refreshed_at TIMESTAMPTZ NOT NULL,
  trustner_preferred BOOLEAN DEFAULT FALSE   -- flag for replacement-recommender
);

-- Trustner's preferred fund list (manually curated, used for SWAP replacements)
CREATE TABLE preferred_funds_by_category (
  category TEXT PRIMARY KEY,
  primary_amfi_code TEXT REFERENCES fund_master(amfi_code),
  secondary_amfi_code TEXT REFERENCES fund_master(amfi_code),
  rationale TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ
);
```

---

## 4. THE METHODOLOGY (deterministic core)

This is the **non-LLM** scoring engine — the IP of the product. It must be deterministic, auditable, and consistent across runs.

### 4.1 Four-Criterion Weighted Scoring

```typescript
// src/lib/portfolio-diagnostic/methodology.ts

export const SCORING_WEIGHTS = {
  cagr3y_vs_category_median: 0.30,
  cagr5y_vs_category_median: 0.25,
  manager_tenure_amc_stability: 0.20,
  category_quartile_position: 0.25,
} as const;

export function composeScore(criteria: {
  cagr3yDelta: number;       // -5 to +15 (pp vs category median)
  cagr5yDelta: number;       // -5 to +15
  managerStability: number;  // 0 to 1
  quartile: 1 | 2 | 3 | 4;
}): number {
  // Each criterion normalised to 0-1 then weighted
  const c1 = clamp01(0.5 + criteria.cagr3yDelta / 20);
  const c2 = clamp01(0.5 + criteria.cagr5yDelta / 20);
  const c3 = criteria.managerStability;
  const c4 = (5 - criteria.quartile) / 4;  // Q1=1.0, Q2=0.75, Q3=0.5, Q4=0.25

  return (
    c1 * SCORING_WEIGHTS.cagr3y_vs_category_median +
    c2 * SCORING_WEIGHTS.cagr5y_vs_category_median +
    c3 * SCORING_WEIGHTS.manager_tenure_amc_stability +
    c4 * SCORING_WEIGHTS.category_quartile_position
  );
}
```

### 4.2 Verdict Thresholds

| Composite Score | Verdict | Action |
|---|---|---|
| ≥ 0.80 | **STAR** | Top quartile; no change |
| 0.60 - 0.80 | **KEEP** | Top half; continue SIP |
| 0.40 - 0.60 | **SWAP** | Median or below; recommend replacement |
| < 0.40 | **SWAP** (urgent) | Bottom quartile; recommend replacement |
| Special | **WATCH** | < 3Y track record; defer judgment |
| Special | **LIQUIDATE** | Position value < ₹2,000 |

### 4.3 Replacement Fund Recommender (for SWAPs)

When a fund is marked SWAP, the engine looks up `preferred_funds_by_category` table for the user's existing category:

```
PGIM Flexi Cap (Score 0.42) → Lookup category "Flexi Cap" → preferred_funds_by_category
  primary: Parag Parikh Flexi Cap
  secondary: HDFC Flexi Cap
```

The recommender returns the primary unless:
- User already holds the primary → recommend secondary
- Primary's category quartile dropped below Q2 in last refresh → recommend secondary

---

## 5. LLM NARRATIVE LAYER (Claude API)

The LLM does **NOT** make scoring decisions. It only generates human-readable text around the deterministic outputs.

### 5.1 Use Cases

| Use | Model | Token estimate |
|---|---|---|
| Executive Summary (paragraph) | claude-sonnet-4-5 | ~500 in / 300 out |
| Per-verdict rationale (× 26 holdings) | claude-haiku-4-5 | ~150 in / 100 out × 26 |
| Swap-card narrative (× 5 swaps) | claude-sonnet-4-5 | ~300 in / 200 out × 5 |
| Reactive Q&A chatbot on result page | claude-sonnet-4-5 | streaming |

Estimated cost per diagnostic: **~₹1.50 - ₹2.00** at current Claude pricing.

### 5.2 Prompt Engineering Principles

- **Anchoring:** Always pass the deterministic data (scores, CAGRs, categories) into the prompt. Never let the LLM "decide" the verdict.
- **Hallucination guardrails:** System prompt explicitly says "do not invent any fund performance numbers; use only the data provided."
- **Compliance:** All LLM output must end with the SEBI/AMFI disclosure block (added programmatically, not by LLM).
- **Caching:** Use Claude's prompt caching for the methodology preamble (saves ~80% on routine calls).

### 5.3 Example Prompt Structure

```
SYSTEM: You are a CFP-grade analytical writing assistant for Trustner Asset Services. 
Generate a 60-80 word rationale for a fund verdict. Use ONLY the data provided. 
Do not invent numbers. Use plain, professional English (not marketing language).

USER: Generate a verdict rationale for:
- Fund: PGIM India Flexi Cap
- Verdict: SWAP
- 3Y CAGR: 10.37% (category median: 17.5%, delta: -7.13pp)
- 5Y CAGR: 9.60% (category median: 16.2%, delta: -6.6pp)
- Manager: Vinay Paharia, joined July 2022 (after Aniruddha Naha exited)
- Category quartile: Q3 (out of 18 flexi-cap funds, ranked 12th)
- Recommended replacement: Parag Parikh Flexi Cap (3Y: 21.8%)

ASSISTANT: [Generates 60-80 word rationale]
```

---

## 6. FUND DATA PIPELINE

### 6.1 Primary Data Source — MFAPI.in (FREE)

- URL pattern: `https://api.mfapi.in/mf/{scheme_code}`
- Returns: NAV history, fund meta, scheme name
- No auth, no rate limit (per their docs)
- **Limitation:** Does not provide CAGR — we compute it ourselves from NAV history

### 6.2 Secondary Data Source — AMFI NAV File (FREE)

- URL: `https://www.amfiindia.com/spages/NAVAll.txt`
- Daily snapshot of all scheme NAVs
- Use for: master fund list + current NAV (more reliable than MFAPI for current NAV)

### 6.3 Computation (Cron Job, runs weekly)

```typescript
// Pseudo-code for fund-data refresh cron
async function refreshFundMaster() {
  const amfiList = await fetchAMFINavList();
  for (const fund of amfiList) {
    const navHistory = await fetchMFAPIScheme(fund.amfiCode);
    const cagr1y = calculateCAGR(navHistory, 1);
    const cagr3y = calculateCAGR(navHistory, 3);
    const cagr5y = calculateCAGR(navHistory, 5);
    await upsertFundMaster({ ...fund, cagr1y, cagr3y, cagr5y });
  }
  await recalculateCategoryMedians();
  await recalculateCategoryQuartiles();
}
```

Cron: every Sunday at 02:00 IST (Vercel cron job already in stack).

### 6.4 Optional (Phase 2) — Value Research API

If we want manager tenure, ratings, and detailed factsheets: Value Research charges ~₹50,000/year for API access. Defer until Phase 2.

---

## 7. CAS PDF PARSING

### 7.1 Karvy/CAMS CAS Format

Both NSDL and CAMS issue CAS PDFs with similar structure:
- Header: investor name, PAN, period
- Per-folio block: AMC, folio number, scheme name, units, NAV, market value
- Transaction history (we ignore for v1; only need current holdings)

### 7.2 Library Choice

`pdf-parse` (npm) — handles text-based PDFs well. Karvy CAS PDFs are text-based (not scanned).

### 7.3 Edge Cases

| Edge case | Handling |
|---|---|
| Password-protected PDF | Ask user for password (default = PAN) |
| Scanned image PDF | Show error: "Please upload text-based CAS, not scanned" |
| Mixed CAMS + Karvy holdings | Parse each separately, merge by AMFI code |
| Demat-only holdings (no MF) | Show: "This appears to be a demat statement, not MF CAS" |
| New AMCs not in master | Fall back to fuzzy match on scheme name; flag for manual review |

---

## 8. PDF GENERATION

### 8.1 Template Engine: Handlebars + Puppeteer

Each of the 3 PDFs we built manually for Rohit Jain (Docs 06, 07, 09) becomes a Handlebars template:

```
src/lib/portfolio-diagnostic/report-templates/
├── diagnostic-report.html.hbs   ← Doc 06 — 10-section institutional report
├── full-review.html.hbs         ← Doc 09 — 2-page graphical summary
└── action-sheet.html.hbs        ← Doc 07 — 1-page sign-off
```

Variables to inject: `{{family_name}}`, `{{aum_inr}}`, `{{holdings_loop}}`, `{{swap_cards_loop}}`, etc.

### 8.2 Rendering

```typescript
// pseudo
const html = await compileTemplate('diagnostic-report.html.hbs', diagnosticData);
const pdf = await puppeteer.launch().pdf({ format: 'A4', margin: { ... } });
const blobUrl = await vercelBlob.put(`diagnostic-${runId}.pdf`, pdf);
return blobUrl;
```

### 8.3 Branding

All templates carry the Trustner logo + colors (TEAL #0F766E, GOLD #D4A017, NAVY #1A1A2E) — same as the existing manual deliverables.

---

## 9. DELIVERY & LEAD CAPTURE

### 9.1 Email (Phase 1)

Resend (already in stack):
- Subject: "Your Portfolio Diagnostic Report is Ready — [N] funds reviewed"
- Body: Brief summary + 3 PDF attachments
- CC: leads@trustner.in for sales team

### 9.2 WhatsApp (Phase 2)

Gupshup or Twilio:
- Send 1: "Your diagnostic is ready. Download here: [link]"
- Send 2 (24 hr later): "Have questions? Book a free consultation: [Cal.com link]"

### 9.3 CRM Integration

Each completed diagnostic creates a lead in Trustner CRM with:
- Contact details
- Diagnostic summary (X Keep, Y Swap, Z Liquidate, ₹ swap amount)
- PDF links
- Lead score (high if AUM > ₹25 L, multiple swap recommendations, no current advisor)

---

## 10. COMPLIANCE & LEGAL

### 10.1 Positioning Language (NOT advice)

All UI copy + PDFs must say:
> "This report is a category-benchmarked diagnostic provided for educational purposes by Trustner Asset Services Pvt. Ltd., an AMFI-Registered Mutual Fund Distributor (ARN-286886). It does not constitute personalised investment advice under SEBI's Investment Adviser Regulations 2013."

### 10.2 Data Privacy

- PAN stored encrypted (AES-256) in Supabase
- CAS PDF auto-deleted from Vercel Blob 90 days after generation (unless user opts in)
- User can request deletion anytime (GDPR-style "right to be forgotten")
- Cookies + analytics: standard banner with opt-out

### 10.3 SEBI/AMFI Considerations

- We are an MFD, not an RIA → cannot charge fees for advice
- We CAN provide educational diagnostics for free
- Free diagnostic is positioned as "client onboarding tool", not advisory product
- Trustner's existing AMC distributor agreements cover the lead-gen activity

---

## 11. METRICS & SUCCESS CRITERIA

### 11.1 Phase 1 (MVP) — Track from Week 1

| Metric | Target by Month 3 |
|---|---|
| Diagnostics completed | 500 |
| Completion rate (start → finish) | > 60% |
| Avg AUM per diagnostic | ₹15-25 L |
| CTR on "Book consultation" | > 15% |
| Consultation → onboarding conversion | > 25% |
| New AUM acquired via diagnostic | ₹3-5 Cr |

### 11.2 Phase 2-3 — Quality + Engagement

| Metric | Target |
|---|---|
| Quarterly re-diagnostic rate (return users) | > 40% |
| Average user satisfaction (post-report survey) | > 4.5 / 5 |
| % of diagnostics shared with family/friends | > 20% |
| Number of executed swaps via Trustner | > 100/month |

---

## 12. PHASED ROLLOUT

### Phase 1 — MVP (Weeks 1-6)
- ✅ Spec finalised
- 🟡 Scaffold code in merasip.com (this PR)
- ☐ Fund master table populated (cron job)
- ☐ CAS parser tested on 15 sample files
- ☐ Scoring engine + verdict thresholds
- ☐ 3 PDF templates (Handlebars)
- ☐ Email delivery via Resend
- ☐ Soft launch to existing Trustner clients (50 users)

### Phase 2 — Refinement (Months 2-3)
- ☐ WhatsApp delivery
- ☐ Trustner admin dashboard (edit verdicts before send)
- ☐ Reactive Q&A chatbot on result page
- ☐ Improve replacement recommender (auto-rebalance after each weekly refresh)
- ☐ A/B test PDF formats
- ☐ Public launch + paid ads

### Phase 3 — Scale (Months 4-6)
- ☐ User login + dashboard
- ☐ Quarterly auto-refresh
- ☐ Premium tier (advanced features)
- ☐ BSE Star MF integration for direct execution
- ☐ Account Aggregator (AA) framework for live portfolio sync

---

## 13. RISK & MITIGATION

| Risk | Likelihood | Mitigation |
|---|---|---|
| CAS PDF format changes | Medium | Unit-test parser on 50+ sample files; alert when parse rate < 90% |
| MFAPI.in goes down | Low | Cache fund data in Postgres; fallback to AMFI NAV file |
| Claude API outage | Low | Graceful degradation: deliver report with template text (no LLM narrative) |
| SEBI clarifies MFD vs RIA boundary | Medium | Legal review every 6 months; keep "educational" positioning |
| User uploads malicious PDF | Low | Sandbox parsing in serverless function; max 10 MB upload limit |
| Lead leakage (competitor distribs scrape leads) | Low | Server-side processing only; no public lead pages |

---

## 14. OPEN QUESTIONS (for product owner decision)

1. **Pricing:** Free forever, or free first diagnostic + ₹999/year for re-diagnostics? (Recommend: free forever for lead-gen value)
2. **Branding:** Co-brand with Trustner or pure "Mera SIP Online" branding? (Recommend: dual-brand — adds advisor credibility)
3. **First-party CAS:** Do we want to issue our own consolidated CAS from BSE Star MF for users who onboard? (Phase 3)
4. **Tax filing tie-in:** Integrate with TaxBuddy/ClearTax for end-to-end tax filing during March quarter? (Phase 3)
5. **B2B angle:** License the engine to other MFDs / fee-only RIAs? (Phase 4 — future revenue stream)

---

## 15. NEXT 10 STEPS (in order)

1. Approve this spec
2. Scaffold the file structure (`src/lib/portfolio-diagnostic/*`) — *this PR*
3. Build scoring engine + methodology module — *this PR*
4. Create Supabase schema migration
5. Set up MFAPI.in client + weekly cron job
6. Build CAS parser; test on 5 sample files
7. Convert Rohit Jain HTML templates → Handlebars
8. Build the upload UI + result page
9. Wire Claude API for narrative layer
10. Soft launch to 20 existing Trustner clients for feedback

---

*Spec prepared by: Ram Shah, CFP™ | Trustner Asset Services Pvt. Ltd. | ARN-286886*
*This document is internal. Engineering details may evolve during build.*
