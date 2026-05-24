# Trustner Platform — Operations Handbook

Audience: HR + Operations + senior planners. The "what to do when X" reference.

---

## 1. Org structure on the platform

Every employee has:
- **A reporting manager** — set in the platform via `/admin/employees`
- **A role** — controls what they can do (admin/senior_reviewer/mid_reviewer/junior_analyst/trainee)
- **A visibility scope** — derived from their role, controls *whose work they can see*

The hierarchy is enforced automatically. When Ram opens his dashboard, he sees every diagnostic in the firm. When a junior analyst opens theirs, they see only their own. A senior reviewer sees their entire subtree (their direct reports + their reports' reports, all the way down).

---

## 2. Role catalog (out of the box)

| Role | Level | What they can do | What they see |
|---|---|---|---|
| **admin** | L5 | Everything: upload, edit, review, approve, publish, share, manage users | Whole firm |
| **senior_reviewer** | L4 | Upload, review, approve, publish, share. Sign off on portfolios up to a configured AUM cap. | Their full subtree (manager + everyone below) |
| **mid_reviewer** | L3 | Upload, review, approve drafts. No publish. | Direct reports + own work |
| **junior_analyst** | L2 | Upload, edit drafts, run client orientations. No approval power. | Own work only |
| **trainee** | L1 | Read-only access to learning materials. Cannot create production work. | Own work only |

Roles + their exact permissions are editable at `/admin/roles`. The grid is the governance artefact — if SEBI asks "what can a senior reviewer do", show them this page.

---

## 3. Day-1 tasks for HR

When a new employee joins:

1. Open `/admin/employees`.
2. Their row should already exist (created by IT during onboarding). If not, escalate to engineering.
3. Click **Edit**.
4. Set their **Reporting Manager** from the dropdown (only active employees show up).
5. Pick a **PD Role** appropriate to their level:
    - New graduate analyst → `trainee` for first 3 months → `junior_analyst` post-confirmation
    - Lateral senior hire → `mid_reviewer` (typically) → `senior_reviewer` after AUM-cap qualifying review
    - Director / partner → `admin`
6. Optionally add certifications (CFP, CFA, NISM-V-A, etc.) — these surface in audit logs and on report headers.
7. Click **Save**. The change is timestamped and audit-logged.

**That's it.** The new employee will immediately see only what their role's scope allows. Their manager will see their work the moment they create their first draft.

---

## 4. When an employee leaves

1. `/admin/employees` → their row → **Edit**.
2. Change their PD Role to **— No PD role —**.
3. (Optionally) clear their reporting manager.
4. Save.

The historical audit trail in `app_role_assignments` remains intact — we always know what they could do, when. If they had work in flight, the dashboard will show those drafts in their old manager's queue.

---

## 5. When an employee gets promoted

Same flow as Day-1 onboarding. Change the role + (if applicable) the reporting manager. Every change creates a new row in `app_role_assignments` — we never overwrite history.

---

## 6. When something seems broken

1. Open **`/admin/health`** first. Always. If it shows a red banner, that's the issue — follow the on-page instructions.
2. If `/admin/health` is green and something still feels off, check:
    - Is the user logged in (cookie expires every 24h for admin, 12h for employee)?
    - Does the user's role have the permission they're trying to use? Check `/admin/roles`.
    - Is their reporting manager set correctly? Check `/admin/employees`.
3. Escalate to engineering with:
    - The user's email
    - The exact URL they were on
    - Time of incident
    - A screenshot

---

## 7. Compliance & audit

- **Every artefact view is logged** in `app_artefact_views` (who, what, when).
- **Every role assignment** is logged in `app_role_assignments` (who held what, when, who assigned it).
- **Every workflow action** (submit/approve/publish/share) is logged in `pd_workflow_events`.
- **Every client share** is logged with selected deliverables + recipients in the audit trail on the diagnostic page itself.

To answer "who has accessed client X's data in the last 6 months":
```sql
SELECT v.viewed_at, e.name, v.scope_used, v.artefact_type
FROM app_artefact_views v
JOIN employees e ON e.id = v.viewer_employee_id
WHERE v.artefact_type = 'client_family' AND v.artefact_id = <FAMILY_ID>
  AND v.viewed_at > NOW() - INTERVAL '6 months'
ORDER BY v.viewed_at DESC;
```

(Engineering will build a UI for this in a follow-up.)

---

## 8. Scope cheat sheet (for explaining to new joinees)

When a new joinee asks "why can't I see X's diagnostic?", the answer is in the scope:

| Your role's scope | You see... |
|---|---|
| `own` | Only drafts/reviews/publications you personally own |
| `direct_reports` | Above + work done by people who report directly to you |
| `subtree` | Above + your reports' reports + their reports... all the way down |
| `firm` | Everything. Reserved for directors. |

If you genuinely need to see something outside your scope (e.g. covering for a colleague), ask your reporting manager to either:
- Temporarily assign you a wider-scope role, or
- Re-assign the specific client / artefact to you (then it's "your own").

---

## 9. Health check before any release

Engineering runs this before pushing to production:

```bash
cd sip-platform
./scripts/check-prod-env.sh merasip
```

Exit code 0 = safe to deploy. Non-zero = something's missing on Vercel; do not deploy until it's fixed.

The same check runs automatically via GitHub Actions on every push to main.

---

## 10. Who to contact

- **Platform issues / bugs / feature requests** → engineering (Ram for now)
- **Role + access requests** → reporting manager → escalates to admin if needed
- **Compliance audit queries** → query the audit tables directly (SQL examples above)

---

*Last updated: May 2026. Maintained by Trustner Asset Services Pvt. Ltd.*
