# Trustner Workbench — Team Testing Guide

> **For**: Trustner team running first round of platform testing
> **Date**: Monday, 25 May 2026
> **Platform**: https://www.merasip.com (production)
> **Status**: All systems verified green at handoff time

---

## How to read this guide

We've built a tiered review-and-publish workflow for portfolio diagnostics, plus 5 other agents (Meeting Prep, Investment Proposal, Client Orientation, Periodic Review). Your job in this round: **use it like you would in real life**, find what's awkward, and report back.

Every page below opens in the browser. Test on Chrome/Edge/Safari — all work.

---

## STEP 1 — Sign in (do this once)

1. Go to **https://www.merasip.com/admin/login**
2. Sign in with your Trustner email + password
3. If you see "Save error: Not authenticated" anywhere later, **your 24-hour session expired** — just re-login. The form data is auto-saved locally; nothing is lost.

---

## STEP 2 — Confirm the platform is healthy (60 seconds)

Open **https://www.merasip.com/admin/health**

You should see:
- A green "✓ All systems operational" banner
- Database round-trip < 500ms
- Employee row count: 24
- All env vars marked "Set" (green)

If anything's red, **stop and message Ram** before continuing.

---

## STEP 3 — Walk the Portfolio Diagnostic happy path

This is the flagship flow. Do it once end-to-end so you understand the workbench.

1. Go to **https://www.merasip.com/admin/portfolio-diagnostic**
2. Click **+ New Portfolio Diagnostic**
3. **Family tab**: enter a real-but-test family name (e.g. "Test_<YourInitials>_25May"), contact name, mobile (10 digits), pick a Segment (Mass/Retail/HNI/UHNI/Corporate). Email is optional.
4. **Holdings tab**: upload a CAS PDF — any consolidated account statement from CAMS/KFin works. If it's password-protected, the system asks for the password; if not, it parses directly.
5. **SIPs tab**: review the parsed SIPs. Override anything that looks wrong.
6. Click **Save Draft** — should redirect to the edit page within 2 seconds.
7. Click **Submit for Review** — the system auto-assigns a reviewer.
8. (Switch roles, or log in as another team member) Open the same diagnostic → click **Approve**.
9. Click **Mark Published** — confirms the dialog now reads "client will NOT be auto-emailed". Status becomes PUBLISHED.
10. **Internal Preview block** (advisor-only): click the 6 deliverable buttons — One-Pager, Full, Three-Pager, Action Sheet, XLSX, PPTX. Each should open in a new tab. HTML ones use Cmd+P → Save as PDF.

### Share with Client (the new part)

11. Scroll to the teal **"Share with Client"** panel (only visible after Approve/Publish).
12. Click **Compose share**.
13. Tick **One-Pager Snapshot** only (smallest test).
14. **Recipient**: paste your OWN email — sanity test before sending to real clients.
15. **Cc**: keep `wecare@merasip.com` (the default).
16. Add a short note: *"This is a test send — please ignore."*
17. Click **Send to Client** — wait for the "Sent" alert.

> **Resend note**: Right now, email sending is disabled until Ram adds `RESEND_API_KEY` to Vercel. You'll see "Send failed: RESEND_API_KEY not configured". That's expected — but the audit row + share-history timeline still get written, so the rest of the testing still works.

18. Refresh the page — your share appears in the **Share History** at the bottom of the panel with your email.

---

## STEP 4 — Test the new strategic surfaces

### A. Client Directory — https://www.merasip.com/admin/clients

This is the home for our 6000-family base. After your STEP 3 test family appears here:

- Search by name — type partial text, hit Enter
- Filter by segment dropdown
- Sort by "AUM (high → low)" — your test family should appear
- **Click the family name** → opens the family detail page

### B. Family Detail — clicked from the directory

Verify:
- Identity card shows contact + segment + mobile + email
- KPI tiles show Latest AUM, Entities, Total Artefacts
- "Portfolio Diagnostics" block shows your test diagnostic
- "Who has viewed this family's data" shows your own name as the first row
- Click **Open full audit →** to see the full read trail

### C. Team — https://www.merasip.com/admin/employees

- See the org chart toggle (top right)
- Search for a name
- Click your name → goes to your performance page

### D. Performance — https://www.merasip.com/admin/employees/1 (or your ID)

Verify:
- 4 KPI tiles (Uploaded / Approved / Avg TAT / Shares)
- Status breakdown table
- "Currently In Their Queue" — should show what's assigned to you
- Recent activity timeline at the bottom

### E. Roles — https://www.merasip.com/admin/roles

Trustner principals (Ram + Sangeeta) see this. You'll see the 5-role permission matrix:
- trainee · junior_analyst · mid_reviewer · senior_reviewer · admin
- Click any cell to edit (only Ram/Sangeeta can save)

### F. Capacity — https://www.merasip.com/admin/capacity

The bottleneck-finder. Shows per-person workload. **Red rows** = ≥5 reviews in queue OR oldest review > 48h. 🔥 icon = hotspot. Click any name → their performance page.

### G. Audit Log — https://www.merasip.com/admin/audit/views

The compliance log. Filter by:
- Artefact type (Portfolio Diagnostic, Meeting Brief, etc.)
- Family ID (paste any number from the directory)
- Viewer (employee ID)
- Date range
- **Export to CSV** → for SEBI/RBI compliance queries

---

## STEP 5 — Try to break it (we want bugs)

Things that should NOT happen — please report if they do:

| Symptom | Means |
|---|---|
| "Save error: Not authenticated" persists after re-login | Auth bug |
| Page loads forever (spinner doesn't go away) | API timeout / DB issue |
| Click a button → nothing happens | Stale JS, hard refresh + retry |
| Red banner at top of any /admin/* page | Production health degraded — message Ram |
| Save Draft succeeds but the family doesn't appear in `/admin/clients` | Indexing issue |
| Share email link gives 401 when opened in incognito | Token validation broken |
| Audit log doesn't show your reads after a few minutes | Logging pipeline issue |

---

## What to report back

Send Ram (or post in the team channel):

1. **One-line summary** (e.g. "Worked smoothly except 3 papercuts")
2. **Anything that confused you on first try** (UX, labels, sequence — these are the most valuable signals)
3. **Anything visibly slow** (> 3 sec to load)
4. **Anything that didn't match what you'd expect from real client work**
5. **Screenshots** of any error or weird state — paste them in directly

---

## When testing is done

If everything looks good:
- Ram will add `RESEND_API_KEY` to enable real client emails
- Ram will assign each of you to your real client families
- We start migrating the 6000 existing clients in batches

If anything is broken: don't try to fix it yourself. Just report — Ram will triage.

---

## Reference URLs at a glance

| What | URL |
|---|---|
| Login | https://www.merasip.com/admin/login |
| Health check | https://www.merasip.com/admin/health |
| PD dashboard | https://www.merasip.com/admin/portfolio-diagnostic |
| New diagnostic | https://www.merasip.com/admin/portfolio-diagnostic/new |
| Client directory | https://www.merasip.com/admin/clients |
| Team list | https://www.merasip.com/admin/employees |
| Capacity heatmap | https://www.merasip.com/admin/capacity |
| Audit log | https://www.merasip.com/admin/audit/views |
| Roles matrix | https://www.merasip.com/admin/roles |

---

*Built and verified by Ram + Claude · 25 May 2026 handoff*
