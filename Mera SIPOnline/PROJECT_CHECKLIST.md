# Trustner Agent Platform — Build Checklist

**Your role:** Run commands, supply secrets, copy files, test in browser.
**My role:** Write all the code, write all the SQL, write all the templates, fix bugs, explain what each piece does.

We build in this order. Each checkbox is roughly **1 work session** (1-3 hours).
Mark items ✅ as we complete them so we both know where we are.

---

## PHASE 0 — PREREQUISITES (You do these once, ~30 min)

These unblock everything else.

- [ ] **0.1** Confirm merasip.com Supabase project URL + service-role key are in `sip-platform/.env.local`. Required env vars:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```
- [ ] **0.2** Add new env vars (we'll need these for the agents):
  ```
  ANTHROPIC_API_KEY=sk-ant-...           # for Claude narratives
  RESEND_API_KEY=re_...                  # for email delivery (already set?)
  BLOB_READ_WRITE_TOKEN=...              # Vercel Blob (already set?)
  CRON_SECRET=<generate-a-random-string> # for cron job auth
  ```
  Tell me which of these you already have and which need fresh ones.

- [ ] **0.3** Run the 3 portfolio-diagnostic migrations on Supabase. Two options:
  - **A) Supabase Studio SQL Editor:** Copy-paste each file into the SQL Editor and run.
  - **B) Supabase CLI:** `supabase db push` from the project root if you have the CLI set up.
  - Files to run in order:
    1. `sip-platform/src/lib/db/migrations/004_portfolio_diagnostic_schema.sql`
    2. `sip-platform/src/lib/db/migrations/005_portfolio_diagnostic_seed.sql`
    3. `sip-platform/src/lib/db/migrations/006_meeting_prep_schema.sql`
  - Report any errors back to me.

- [ ] **0.4** Assign yourself the `admin` role. Get your employee ID first:
  ```sql
  SELECT id, name, email FROM employees WHERE email = 'ram@trustner.in';
  ```
  Then assign:
  ```sql
  INSERT INTO pd_employee_roles (employee_id, role_id, certifications, is_active)
  VALUES (
      (SELECT id FROM employees WHERE email = 'ram@trustner.in'),
      (SELECT id FROM pd_roles WHERE name = 'admin'),
      ARRAY['CFP'],
      true
  );
  ```
  Also assign Sangeeta when ready:
  ```sql
  INSERT INTO pd_employee_roles (employee_id, role_id, certifications, is_active)
  VALUES (
      (SELECT id FROM employees WHERE email = 'sangeeta@trustner.in'),
      (SELECT id FROM pd_roles WHERE name = 'senior_reviewer'),
      ARRAY['NISM-V-A'],
      true
  );
  ```

- [ ] **0.5** Start the dev server and visit `/admin/portfolio-diagnostic`. You should see the empty dashboard with your name + role displayed. Confirm this works before we proceed.
  ```bash
  cd "Mera SIPOnline/sip-platform"
  npm run dev
  ```

---

## PHASE 1 — DATA INGESTION (I build, you sanity-check, ~3-4 sessions)

These unblock creating real diagnostics.

- [ ] **1.1** *Me:* CAS PDF parser module (`src/lib/portfolio-diagnostic/cas-parser.ts`)
- [ ] **1.2** *Me:* MFAPI.in fund data client (`src/lib/portfolio-diagnostic/fund-data-client.ts`)
- [ ] **1.3** *Me:* Weekly cron route to refresh fund master + category benchmarks (`src/app/api/cron/refresh-fund-master/route.ts`)
- [ ] **1.4** *Me:* "New Diagnostic" upload UI (`src/app/admin/portfolio-diagnostic/new/page.tsx`) — CAS upload tab + manual entry tab + SIP tab
- [ ] **1.5** *Me:* Create-draft API (`src/app/api/admin/portfolio-diagnostic/draft/route.ts`)
- [ ] **1.6** *You:* Run cron once manually to populate `pd_fund_master` (curl with `Authorization: Bearer $CRON_SECRET`)
- [ ] **1.7** *You:* Update `pd_preferred_funds_by_category` to point to actual AMFI codes after fund master is loaded

---

## PHASE 2 — REVIEW & APPROVAL UI (~3-4 sessions)

- [ ] **2.1** *Me:* Diagnostic detail page (`src/app/admin/portfolio-diagnostic/[id]/page.tsx`) — read-only view for L1 trainees
- [ ] **2.2** *Me:* Edit draft page (`src/app/admin/portfolio-diagnostic/[id]/edit/page.tsx`) — re-uses upload UI for editing
- [ ] **2.3** *Me:* Review page (`src/app/admin/portfolio-diagnostic/[id]/review/page.tsx`) — sortable tables, verdict overrides, comment threads
- [ ] **2.4** *Me:* Workflow action APIs (submit / assign / approve / request-changes / reject / publish)
- [ ] **2.5** *Me:* Comment thread component (re-usable across agents)

---

## PHASE 3 — PDF GENERATION (~2-3 sessions)

- [ ] **3.1** *Me:* Convert Rohit Jain HTML templates (the 4 we built manually) to Handlebars templates
- [ ] **3.2** *Me:* PDF rendering service using Puppeteer/Chrome headless (or `@sparticuz/chromium` for serverless)
- [ ] **3.3** *Me:* Publish action: state transition + PDF generation + Vercel Blob upload + URL persistence
- [ ] **3.4** *You:* Install `npm i puppeteer-core @sparticuz/chromium handlebars` and confirm builds

---

## PHASE 4 — DELIVERY (~1-2 sessions)

- [ ] **4.1** *Me:* Email service using Resend — sends 4 PDFs to client with cover note
- [ ] **4.2** *Me:* WhatsApp service using Gupshup — sends link to PDFs *(or defer if Gupshup account not set up yet)*
- [ ] **4.3** *Me:* Confirmation report (sent back to RM + admin) showing delivery status

---

## PHASE 5 — MEETING PREP AGENT BUILD-OUT (~3 sessions)

- [ ] **5.1** *Me:* Meeting Prep queries DAL (mirrors portfolio diagnostic queries.ts)
- [ ] **5.2** *Me:* Meeting Prep dashboard API
- [ ] **5.3** *Me:* New Meeting Brief upload UI
- [ ] **5.4** *Me:* Auto-generation pipeline (pulls relationship snapshot, recent transactions, market context) via Claude
- [ ] **5.5** *Me:* Meeting Brief HTML→PDF template (3-4 page internal briefing pack)

---

## PHASE 6 — INVESTMENT PROPOSAL AGENT (~4 sessions)

- [ ] **6.1** *Me:* Migration 007 for `ip_*` tables
- [ ] **6.2** *Me:* Asset allocation engine module (risk profile → allocation %)
- [ ] **6.3** *Me:* Fund-picker module (allocation + preferred funds → specific recommendations)
- [ ] **6.4** *Me:* Investment Proposal types + queries
- [ ] **6.5** *Me:* Dashboard + upload + review UI
- [ ] **6.6** *Me:* Proposal PDF template

---

## PHASE 7 — CLIENT ORIENTATION AGENT (~3 sessions)

- [ ] **7.1** *Me:* Migration 008 for `co_*` tables
- [ ] **7.2** *Me:* Risk-profile questionnaire UI (15-20 questions)
- [ ] **7.3** *Me:* Goal-planning module (corpus targets, monthly commitment math)
- [ ] **7.4** *Me:* Orientation dashboard + upload + review UI
- [ ] **7.5** *Me:* 3 PDFs: Welcome Pack, Risk Profile, Goal Statement

---

## PHASE 8 — PERIODIC REVIEW AGENT (~2 sessions)

- [ ] **8.1** *Me:* Migration 009 for `pr_*` tables
- [ ] **8.2** *Me:* Cron job that creates draft 7 days before quarter-end
- [ ] **8.3** *Me:* Periodic Review UI (mostly auto-filled from latest Portfolio Diagnostic + transactions delta)
- [ ] **8.4** *Me:* Performance attribution module
- [ ] **8.5** *Me:* Periodic Review PDF template

---

## PHASE 9 — ADMIN POLISH (~2 sessions)

- [ ] **9.1** *Me:* User management UI (`/admin/portfolio-diagnostic/users`) — assign roles, view pending counts, edit certifications
- [ ] **9.2** *Me:* Family management UI (`/admin/portfolio-diagnostic/families`) — search, edit, view diagnostic history
- [ ] **9.3** *Me:* Audit log viewer (filter by employee, agent, date range, action)
- [ ] **9.4** *Me:* Methodology version control UI (admin can update weights with changelog)

---

## PHASE 10 — PUBLIC LAUNCH (~3 sessions)

- [ ] **10.1** *Me:* Public-facing `/portfolio-diagnostic` route (logged-out users)
- [ ] **10.2** *Me:* Lead capture + auto-create draft (assigned to a "lead-intake" queue)
- [ ] **10.3** *Me:* Marketing copy + sample report download
- [ ] **10.4** *You:* SEO optimisation + Google Ads / Facebook for lead-gen
- [ ] **10.5** *Me:* Conversion funnel analytics

---

## RUNNING TALLY

```
Phase 0  Prerequisites           [   /  5 ]
Phase 1  Data Ingestion          [   /  7 ]
Phase 2  Review & Approval UI    [   /  5 ]
Phase 3  PDF Generation          [   /  4 ]
Phase 4  Delivery                [   /  3 ]
Phase 5  Meeting Prep Build-out  [   /  5 ]
Phase 6  Investment Proposal     [   /  6 ]
Phase 7  Client Orientation      [   /  5 ]
Phase 8  Periodic Review         [   /  5 ]
Phase 9  Admin Polish            [   /  4 ]
Phase 10 Public Launch           [   /  5 ]
─────────────────────────────────────────
TOTAL                            [   / 54 ]
```

---

## OUR WORKING RHYTHM

1. **At start of each session:** Tell me which phase + item we're on.
2. **I write the code** — directly into the merasip codebase. No copy-paste needed from you.
3. **I tell you what to install/run** — short commands you execute locally.
4. **I tell you what to test** — single URL to load, single action to take.
5. **You tell me what broke** — paste error messages; I fix in the next message.
6. **We check the box** — and move to the next item.

If something is blocked (waiting for a third-party account, a real CAS PDF, etc.), we **defer the box and skip ahead**. Nothing should stall the build.

---

## DEFINITION OF DONE FOR THE WHOLE PROJECT

✅ All 5 agents live on merasip.com
✅ All migrations run on Supabase
✅ All employees have roles assigned
✅ At least 5 real Trustner client families onboarded and have completed Portfolio Diagnostics
✅ All workflow states tested end-to-end (DRAFT → APPROVED → PUBLISHED → emailed)
✅ Admin user-management UI functional
✅ Documentation in `/docs/admin-workbench/` for the team
✅ Soft launch announcement to existing Trustner clients

---

*Prepared by: Ram Shah, CFP™ + Claude (Engineering Co-pilot)*
*ARN-286886 | Trustner Asset Services Pvt. Ltd.*
