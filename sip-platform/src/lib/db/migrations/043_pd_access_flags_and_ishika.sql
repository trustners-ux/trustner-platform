-- ════════════════════════════════════════════════════════════════════════
-- Migration 043 — PD ACCESS FLAGS + onboard CA Ishika Bajaj (central reviewer)
-- ════════════════════════════════════════════════════════════════════════
-- ADDITIVE + SAFE (gates/routes no one yet — enforcement code comes in Phase 1/2):
--   1) can_access_pd       — the "selected few" switch. DEFAULT true so every
--      existing PD role-holder is grandfathered in (zero lock-out). Admins flip
--      it off to revoke a person's PD access without removing their role.
--   2) is_central_reviewer — marks the firm's central fallback reviewer. When a
--      submitted diagnostic has no capable reporting-manager reviewer, routing
--      falls back to whoever carries this flag (Phase-2 routing).
--   3) Onboard CA Ishika Bajaj as a senior_reviewer (review+approve+PUBLISH) and
--      the central reviewer. We create only her HR/role DATA rows — her login PIN
--      is NOT set here; she sets it on first sign-in (credential creation is a
--      human step, never automated).
-- Idempotent (NOT EXISTS guards + ON CONFLICT).
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE pd_employee_roles
  ADD COLUMN IF NOT EXISTS can_access_pd       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_central_reviewer BOOLEAN DEFAULT false;

-- 1) Ishika's employee (HR) record — no auth_pin_hash (she sets her PIN on first login).
-- doj is NOT NULL → set to today as her system join date (correct the real DOJ later);
-- segment='Support' (central review support for sales); entity='TAS'.
INSERT INTO employees (employee_code, name, email, designation, department, entity, segment, reporting_manager_id, doj, is_active)
SELECT 'TAS-CA-ISB', 'Ishika Bajaj', 'ishika.bajaj@trustner.in', 'Chartered Accountant', 'Portfolio Review', 'TAS', 'Support', 1, CURRENT_DATE, true
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE lower(email) = 'ishika.bajaj@trustner.in');

-- 2) Her PD role: senior_reviewer + central reviewer + PD access
INSERT INTO pd_employee_roles (employee_id, role_id, is_active, can_access_pd, is_central_reviewer)
SELECT e.id, 4, true, true, true
FROM employees e
WHERE lower(e.email) = 'ishika.bajaj@trustner.in'
ON CONFLICT (employee_id) DO UPDATE SET
  role_id = 4, is_active = true, can_access_pd = true, is_central_reviewer = true;

-- Ensure exactly one central reviewer flag is correct: keep Ishika as central,
-- (no other rows are flagged by default — DEFAULT false).
