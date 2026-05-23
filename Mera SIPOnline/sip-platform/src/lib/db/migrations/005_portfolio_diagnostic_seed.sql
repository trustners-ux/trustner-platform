-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER PORTFOLIO DIAGNOSTIC — Seed Data
-- Version: 2.0 | Date: 2026-05-23
-- ═══════════════════════════════════════════════════════════════
-- Seeds the 5 roles and Trustner's preferred funds per category.
-- Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ROLES ──────────────────────────────────────────────────

INSERT INTO pd_roles (
    name, level, can_upload, can_edit_draft, can_review,
    can_approve, can_publish, can_override_hierarchy,
    can_manage_users, approval_aum_ceiling_inr
)
VALUES
    ('trainee',         1, false, false, false, false, false, false, false, 0),
    ('junior_analyst',  2, true,  true,  false, false, false, false, false, 0),
    ('mid_reviewer',    3, true,  true,  true,  true,  false, false, false, 5000000),       -- ₹50 Lakh
    ('senior_reviewer', 4, true,  true,  true,  true,  true,  false, false, 50000000),      -- ₹5 Crore
    ('admin',           5, true,  true,  true,  true,  true,  true,  true,  NULL)           -- unlimited
ON CONFLICT (name) DO UPDATE SET
    level = EXCLUDED.level,
    can_upload = EXCLUDED.can_upload,
    can_edit_draft = EXCLUDED.can_edit_draft,
    can_review = EXCLUDED.can_review,
    can_approve = EXCLUDED.can_approve,
    can_publish = EXCLUDED.can_publish,
    can_override_hierarchy = EXCLUDED.can_override_hierarchy,
    can_manage_users = EXCLUDED.can_manage_users,
    approval_aum_ceiling_inr = EXCLUDED.approval_aum_ceiling_inr;

-- ─── 2. PREFERRED FUNDS BY CATEGORY ───────────────────────────
-- Trustner's curated SWAP targets. The fund_master rows are seeded
-- by the weekly cron job from MFAPI; this seed only sets the
-- "preferred" pointers AFTER fund_master is populated.
--
-- IMPORTANT: This seed assumes pd_fund_master has been populated
-- by the cron job. If running on a fresh DB, run the cron first.
-- The INSERT below uses INSERT … SELECT to avoid hard-coding
-- AMFI codes that may not exist yet.

-- Pre-seed a placeholder so the cron can update it later
INSERT INTO pd_preferred_funds_by_category (
    category, primary_amfi_code, secondary_amfi_code, rationale, updated_at
)
VALUES
    ('Flexi Cap',          NULL, NULL, 'Primary: Parag Parikh Flexi Cap. Secondary: HDFC Flexi Cap.', NOW()),
    ('Large Cap',          NULL, NULL, 'Primary: ICICI Pru Bluechip. Secondary: Mirae Asset Large Cap.', NOW()),
    ('Large & Mid Cap',    NULL, NULL, 'Primary: Motilal Oswal L&M. Secondary: Mirae Asset Emerging Bluechip.', NOW()),
    ('Mid Cap',            NULL, NULL, 'Primary: Nippon India Growth Mid Cap. Secondary: HDFC Mid Cap Opportunities.', NOW()),
    ('Small Cap',          NULL, NULL, 'Primary: Bandhan Small Cap. Secondary: Invesco India Small Cap.', NOW()),
    ('Multi Cap',          NULL, NULL, 'Primary: Kotak Multicap. Secondary: Mahindra Manulife Multi Cap.', NOW()),
    ('Value',              NULL, NULL, 'Primary: ICICI Pru Value Discovery. Secondary: HDFC Capital Builder Value.', NOW()),
    ('Focused',            NULL, NULL, 'Primary: SBI Focused Equity. Secondary: Axis Focused 25.', NOW()),
    ('ELSS',               NULL, NULL, 'Primary: Quant ELSS Tax Saver. Secondary: Mirae Asset Tax Saver.', NOW()),
    ('Aggressive Hybrid',  NULL, NULL, 'Primary: ICICI Pru Equity & Debt. Secondary: HDFC Hybrid Equity.', NOW()),
    ('Balanced Advantage', NULL, NULL, 'Primary: HDFC Balanced Advantage. Secondary: ICICI Pru Balanced Advantage.', NOW()),
    ('Multi Asset',        NULL, NULL, 'Primary: ICICI Pru Multi Asset. Secondary: Nippon India Multi Asset.', NOW())
ON CONFLICT (category) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- POST-MIGRATION CHECKLIST (for ops):
--
-- 1. Run the fund-master cron job to populate pd_fund_master:
--    POST /api/cron/refresh-fund-master (Authorization: CRON_SECRET)
--
-- 2. Update pd_preferred_funds_by_category to point to the actual
--    AMFI codes once the fund-master has them. SQL template:
--      UPDATE pd_preferred_funds_by_category
--         SET primary_amfi_code   = (SELECT amfi_code FROM pd_fund_master
--                                     WHERE scheme_name LIKE 'Parag Parikh Flexi%' LIMIT 1),
--             secondary_amfi_code = (SELECT amfi_code FROM pd_fund_master
--                                     WHERE scheme_name LIKE 'HDFC Flexi%' LIMIT 1)
--       WHERE category = 'Flexi Cap';
--    (Repeat per category, or use an admin UI to manage this.)
--
-- 3. Assign roles to existing MIS employees:
--      INSERT INTO pd_employee_roles (employee_id, role_id, certifications)
--      VALUES
--          ((SELECT id FROM employees WHERE email = 'ram@trustner.in'),
--           (SELECT id FROM pd_roles WHERE name = 'admin'),
--           ARRAY['CFP']),
--          ((SELECT id FROM employees WHERE email = 'sangeeta@trustner.in'),
--           (SELECT id FROM pd_roles WHERE name = 'senior_reviewer'),
--           ARRAY['NISM-V-A']);
-- ═══════════════════════════════════════════════════════════════
