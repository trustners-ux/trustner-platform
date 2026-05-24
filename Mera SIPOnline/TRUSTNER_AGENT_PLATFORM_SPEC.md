# Trustner Agent Platform — Master Architecture Spec

**Vision:** A unified platform on merasip.com where every client-facing deliverable (portfolio review, meeting brief, investment proposal, client orientation, periodic review) flows through the same employee-driven workflow with role-based approval and audit-grade compliance.

**Scope:** All Trustner advisory output — both internal (employee-facing) and external (client-facing) — runs through this platform.

**Owner:** Ram Shah, CFP™ | Trustner Asset Services Pvt. Ltd. | ARN-286886
**Spec Version:** v1.0 | Date: 23 May 2026

---

## 1. THE 5 AGENTS

| # | Agent | Trigger | Output | Primary User | Frequency |
|---|---|---|---|---|---|
| **1** | **Portfolio Diagnostic** | New client onboarding OR existing client portfolio re-review | 4 PDFs: Diagnostic Report, Full Review, Action Sheet, SIP Schedule | RM uploads → CFP approves | Per-client (quarterly or on request) |
| **2** | **Meeting Prep Brief** | Upcoming client meeting (24h before) | 1 PDF: Pre-Meeting Briefing Pack (internal, for RM) | RM auto-receives | Per meeting |
| **3** | **Investment Proposal** | New client / new lump sum / SIP step-up decision | 2 PDFs: Investment Proposal + Risk Disclosure | RM drafts → CFP approves → Client signs | Per investment decision |
| **4** | **Client Orientation** | New client signs onboarding mandate | 3 PDFs: Welcome Pack, Risk Profile, Goal Statement | RM produces → Client signs | One-time per new client |
| **5** | **Periodic Review** | Quarterly / Annual calendar trigger | 1 PDF: Performance Review Note (auto-refresh of Portfolio Diagnostic) | RM drafts → CFP approves | Auto-scheduled |

All 5 agents share: client family data, employee roles, workflow state machine, audit log, PDF pipeline, delivery channels.

---

## 2. THE SHARED PLATFORM LAYERS

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                                 │
│  Common UI: AdminSidebar, StatusBadge, QueueSection, SortableTable,      │
│            CommentThread, ApprovalActions                                │
│  Agent-Specific: Portfolio /admin/portfolio-diagnostic                   │
│                  Meeting   /admin/meeting-prep                           │
│                  Proposal  /admin/investment-proposal                    │
│                  Orient    /admin/client-orientation                     │
│                  Review    /admin/periodic-review                        │
└──────────────────────────┬───────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       API ROUTE LAYER                                    │
│  /api/admin/{agent}/dashboard                                            │
│  /api/admin/{agent}/draft                                                │
│  /api/admin/{agent}/[id]/submit                                          │
│  /api/admin/{agent}/[id]/review                                          │
│  /api/admin/{agent}/[id]/approve                                         │
│  /api/admin/{agent}/[id]/publish                                         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   AGENT LOGIC LAYER (per agent)                          │
│  Portfolio:   scoring-engine, sip-analytics                              │
│  Meeting:     briefing-composer, talking-point-generator                 │
│  Proposal:    proposal-builder, allocation-engine                        │
│  Orient:      risk-profiler, goal-planner                                │
│  Review:      performance-attributor, action-item-tracker                │
└──────────────────────────┬───────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  SHARED PLATFORM LAYER (built once, reused)              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Workflow     │ │ Role-Based   │ │ Audit Log    │ │ Comments     │    │
│  │ State Mgr    │ │ Access Ctrl  │ │ (immutable)  │ │ (threaded)   │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Client       │ │ Employee     │ │ Fund Master  │ │ Tax Engine   │    │
│  │ Family Data  │ │ Hierarchy    │ │ (MFAPI)      │ │ (LTCG/STCG)  │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ PDF          │ │ Claude       │ │ Email        │ │ WhatsApp     │    │
│  │ Generation   │ │ Narrative    │ │ (Resend)     │ │ (Gupshup)    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└──────────────────────────┬───────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER (Supabase Postgres)                     │
│  Shared:   trustner_client_families, trustner_family_entities,           │
│            employees, pd_roles, pd_employee_roles, pd_fund_master        │
│  Per Agent: pd_diagnostic_runs + holdings + sips                         │
│             mp_meeting_briefs + sections                                 │
│             ip_investment_proposals + sections                           │
│             co_client_orientations + sections                            │
│             pr_periodic_reviews + sections                               │
│  All Agents Audit: agent_workflow_events, agent_review_comments          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. THE COMMON WORKFLOW PATTERN

Every agent's output flows through the **same** state machine:

```
DRAFT (L2 creates)
    │
    ▼
SUBMITTED (L2 submits)
    │
    ▼
IN_REVIEW (L3 reviews)         ──┐
    │                              │
    │ if AUM > L3 ceiling           │
    ▼                              │
ESCALATED (L4 reviews)              │
    │                              │
    └──► APPROVED (L4/L5 signs)  ◄─┘
              │
              ▼
        PUBLISHED  ← PDFs generated, delivery queued
```

This is **identical** across all 5 agents. The only difference is what data sits inside the run.

---

## 4. AGENT-SPECIFIC SPECIFICATIONS

### 4.1 Portfolio Diagnostic (already specced — see PORTFOLIO_DIAGNOSTIC_SPEC.md)

| Aspect | Detail |
|---|---|
| **Trigger** | New client OR quarterly refresh OR client-requested |
| **Inputs** | CAS PDF + active SIPs + risk profile |
| **Methodology** | 4-criterion weighted scoring per holding |
| **Output PDFs** | Diagnostic Report (10-sec), Full Review (2-page), Action Sheet (1-page), SIP Schedule |
| **Time per run** | L2: 30 min, L3: 20 min, L4: 10 min, Publish: instant |
| **Status** | ✅ Foundation scaffolded |

---

### 4.2 Meeting Prep Brief

| Aspect | Detail |
|---|---|
| **Trigger** | Calendar event 24h before meeting OR manual request |
| **Inputs** | Client family ID + meeting purpose (review / new investment / grievance / annual catch-up) |
| **Methodology** | Pulls from CRM + last Portfolio Diagnostic + recent transactions + market context; assembles briefing pack |
| **Sections in Output PDF** | 1. Relationship snapshot, 2. Portfolio current state, 3. Recent transactions (last 90 days), 4. Open action items from last meeting, 5. Market context relevant to client's holdings, 6. Suggested talking points (5-7), 7. Anticipated questions + prepared answers, 8. Next-step opportunities (cross-sell/up-sell candidates) |
| **Output PDF** | 1 internal briefing pack (3-4 pages) — for RM only, not client |
| **Time per run** | L2: 15 min (mostly auto-generated, RM adds 2-3 personal notes), L3: 10 min review, Publish: instant |
| **Distribution** | Email to RM's inbox + WhatsApp link |
| **Schema needed** | `mp_meeting_briefs`, `mp_meeting_briefs_sections` |

**Workflow:** RM creates 24h before meeting → auto-generates Section 1-5 → RM adds personal notes in 6-8 → submits → L3 (senior RM or Branch Head) reviews → publishes to RM's email.

**This is INTERNAL output — does not need client sign-off.** Approval is still required so that the briefing has been quality-checked.

---

### 4.3 Investment Proposal

| Aspect | Detail |
|---|---|
| **Trigger** | New client investment OR existing client adding lump sum / new SIP / step-up |
| **Inputs** | Client family ID + investment amount + horizon + risk profile + goal |
| **Methodology** | Asset allocation engine (based on risk profile + horizon) → fund selection from Trustner preferred list → tax efficiency check → expected return modeling |
| **Sections in Output PDF** | 1. Executive Summary (1 paragraph), 2. Client context, 3. Goal statement, 4. Risk profile result, 5. Recommended asset allocation (with rationale), 6. Specific fund recommendations (with category, % allocation, ₹ amount), 7. Tax efficiency (LTCG/STCG planning), 8. Expected outcomes (3 scenarios: conservative/base/optimistic), 9. Implementation plan + SIP setup, 10. Risk disclosures, 11. Sign-off block |
| **Output PDFs** | Proposal (8-10 pages) + Risk Disclosure (1 page) |
| **Time per run** | L2: 45 min, L3: 30 min, L4: 15 min (UHNI requires L4+L5), Publish: instant after client sign-off |
| **Distribution** | Email to client + RM + WhatsApp link |
| **Schema needed** | `ip_investment_proposals`, `ip_proposal_recommendations` |

**Workflow:** RM creates from client meeting → auto-generates allocation + funds → RM customises commentary → submits → CFP approves → emails to client for sign-off → client signs digitally or paper → RM publishes the final mandate.

---

### 4.4 Client Orientation

| Aspect | Detail |
|---|---|
| **Trigger** | Client signs onboarding mandate (one-time per family) |
| **Inputs** | Family contact details + initial KYC documents + risk-profile questionnaire responses + goal-setting interview notes |
| **Methodology** | Compiles welcome pack + risk profile result + goal statement; sets up CRM record; schedules first quarterly review |
| **Sections in Output PDFs** | **Welcome Pack:** 1. Welcome letter from CFP, 2. About Trustner, 3. Our investment philosophy, 4. How we'll work together, 5. Communication cadence, 6. Trustner team for this family. **Risk Profile:** 1. Questionnaire responses, 2. Computed risk score, 3. Resulting risk category, 4. What this means for portfolio construction. **Goal Statement:** 1. Identified goals (retirement, education, house, etc.), 2. Goal-wise corpus targets, 3. Monthly investment commitment, 4. Review cadence |
| **Output PDFs** | Welcome Pack (4-page), Risk Profile (1-page), Goal Statement (2-page) |
| **Time per run** | L2: 60 min (heavily questionnaire-driven), L3: 30 min, L4: signoff, Publish: instant |
| **Distribution** | Email all 3 PDFs + WhatsApp link |
| **Schema needed** | `co_client_orientations`, `co_risk_profile_responses`, `co_goal_statements` |

**Workflow:** RM completes onboarding interview → drafts orientation → CFP reviews + countersigns the risk profile and goal statement → publishes welcome pack.

---

### 4.5 Periodic Review

| Aspect | Detail |
|---|---|
| **Trigger** | Calendar (quarterly / annual) OR client request |
| **Inputs** | Last Portfolio Diagnostic + transactions since last review + market events since last review |
| **Methodology** | Re-runs Portfolio Diagnostic engine with current holdings; compares to last quarter; flags drift, performance attribution, goal progress |
| **Sections in Output PDF** | 1. Period summary, 2. Performance attribution (which funds drove returns), 3. Goal progress (% to target), 4. Action items completed since last review, 5. New action items (any drift / rebalancing / fund swaps), 6. Market context this quarter, 7. Outlook for next quarter, 8. Sign-off |
| **Output PDF** | Periodic Review Note (4-5 pages) |
| **Time per run** | L2: 20 min (most is auto-generated from Portfolio Diagnostic refresh), L3: 15 min, Publish: instant |
| **Distribution** | Email + WhatsApp + dashboard link for client portal (Phase 3) |
| **Schema needed** | `pr_periodic_reviews`, references `pd_diagnostic_runs` for the underlying analysis |

**Workflow:** Cron job creates draft 7 days before quarter-end → RM personalises → CFP approves → publishes.

---

## 5. THE INSTRUCTION TEMPLATE (for adding any future agent)

When you want to add a new agent, instruct engineering with this template:

```
AGENT NAME: [name]

TRIGGER: [when does this run? Calendar / event / manual]

WHO USES IT:
- Primary creator: [L2/L3 role]
- Approvers: [L3/L4/L5]
- End recipient: [client / RM / internal team]

INPUTS REQUIRED:
- [list each input + source]

METHODOLOGY:
- [what analysis/scoring/composition logic runs]
- [what reference data is needed]
- [what stays deterministic vs LLM-narrated]

OUTPUT:
- # of PDFs: [N]
- Each PDF: [name, section count, page count, audience]

SLA TARGETS:
- Draft creation: [time]
- Review turnaround: [time]
- Publish to delivery: [time]

DATA MODEL:
- New tables needed: [list]
- Reuses shared tables: trustner_client_families, employees, pd_roles, etc.

COMPLIANCE NOTES:
- Internal use only, or client-facing?
- SEBI/AMFI considerations
- Requires client sign-off?
```

You give engineering this template + the agent name; they build it on top of the existing platform.

---

## 6. PHASED ROLLOUT

### Phase 1 — Foundation (Done)
- ✅ Portfolio Diagnostic scaffold
- ✅ Workflow state machine
- ✅ Role hierarchy
- ✅ Database schema
- ✅ Dashboard UI

### Phase 2 — First Production Agent (Sprints 1-4, ~4 weeks)
- Finish Portfolio Diagnostic MVP (CAS parser, MFAPI cron, PDF templates, delivery)
- Run with 5 pilot clients
- Iterate on UI based on RM feedback

### Phase 3 — Meeting Prep Agent (Sprints 5-7, ~3 weeks)
- Reuses 90% of Portfolio Diagnostic infrastructure
- New: briefing-composer module + meeting-brief PDF template
- Calendar integration with existing Trustner CRM

### Phase 4 — Investment Proposal Agent (Sprints 8-11, ~4 weeks)
- New: allocation-engine + proposal-builder modules
- E-signature integration (DigiLocker / DocuSign India)
- Goal-tracking link to Periodic Review agent

### Phase 5 — Client Orientation + Periodic Review (Sprints 12-14, ~3 weeks)
- Orientation: heavy questionnaire UI but straightforward output
- Periodic Review: largely a cron-triggered variant of Portfolio Diagnostic

### Phase 6 — Public-Facing Versions (Sprints 15-18, ~4 weeks)
- Public "Free Portfolio Diagnostic" lead-magnet on merasip.com
- "Plan your goals" calculator + auto-Investment-Proposal output (educational only, requires advisor sign-off to act)
- WhatsApp bot for client portal access

**Total to full suite live: ~18 weeks (4.5 months) with one focused engineer; ~10-12 weeks with two engineers.**

---

## 7. WHAT MAKES THIS UNIQUE TO TRUSTNER

| Feature | Industry Standard | Trustner Platform |
|---|---|---|
| Multi-agent platform | Each agent siloed (CRM has its own tools, advisor has Excel, etc.) | Unified workflow + audit + roles across all agents |
| Methodology versioning | Not tracked | Every published PDF stamps the methodology version |
| Role-gated publishing | Manual policy (often violated) | Hard-coded enforcement at the state-machine level |
| Junior → Senior pipeline | Ad-hoc Excel reviews | Codified routing + escalation + SLA tracking |
| Client portal sync | Separate system | Same data powers internal review + client portal |
| Compliance audit trail | Scattered emails/Excel | Single immutable event log per agent run |

This is a **defensible product** for Trustner. No other Indian MFD has anything like it. Eventually licensable to other MFDs as B2B SaaS.

---

## 8. INSTRUCTIONS FOR ENGINEERING (NEXT 30 DAYS)

Sprint-by-sprint guidance:

**Sprint 1 (Week 1):**
- Run migrations 004 + 005 on Supabase
- Assign roles to existing employees via SQL (template in 005)
- Build the CAS PDF parser (pdf-parse library)
- Test parser on 10 sample CAS files

**Sprint 2 (Week 2):**
- Build MFAPI.in client + weekly cron to populate `pd_fund_master`
- Populate `pd_preferred_funds_by_category` with actual AMFI codes
- Build category-benchmark refresh job

**Sprint 3 (Week 3):**
- Convert Rohit Jain HTML templates to Handlebars
- Build PDF generation pipeline (Puppeteer / Chrome headless)
- Wire up Claude API for verdict rationale narratives

**Sprint 4 (Week 4):**
- Build the upload + review + approve + publish UI screens
- Email + WhatsApp delivery
- Soft launch with 5 pilot clients (existing Trustner clients only)

**At end of Sprint 4 → Portfolio Diagnostic MVP is live.**

After that, repeat the same pattern for Meeting Prep, Investment Proposal, Orientation, Periodic Review.

---

## 9. WHAT IS "ENOUGH" — A FRAMEWORK

You asked: "is what we've done enough, or do I need to instruct more?"

**The foundation is enough** if you commit to building all 5 agents on top of it over 4-5 months.

**You need to instruct more** if you want any of these:
1. **Different methodology weights** — instruct engineering to update `methodology.ts` (it's the only place to change)
2. **A 6th or 7th agent** — use the instruction template in Section 5
3. **A different role structure** — update `roles-and-hierarchy.ts` + `005_*.sql` seed
4. **Different output PDFs** — update the Handlebars templates (not yet built)
5. **Different language / regional adaptation** — wrap Claude prompts with locale instructions
6. **B2B licensing of the platform** — extract the platform into a separate Trustner Tech subsidiary product
7. **Integration with external systems** — BSE Star MF, AA Framework, DigiLocker, ClearTax — each is a 1-2 week add

The foundation supports all of these. The platform is designed to be **extensible by instruction**, not by re-architecture.

---

*Prepared by Ram Shah, CFP™ | Trustner Asset Services Pvt. Ltd. | ARN-286886*
*Companion document: PORTFOLIO_DIAGNOSTIC_SPEC.md (agent #1 detailed spec)*
*Subsequent companion docs (to be written): MEETING_PREP_AGENT_SPEC.md, INVESTMENT_PROPOSAL_SPEC.md, CLIENT_ORIENTATION_SPEC.md, PERIODIC_REVIEW_SPEC.md*
