-- Migration 019: HR Offices master + holiday location scoping + employee CRUD enablers
-- Custom Trustner HRMS — Phase 2
--
-- Changes:
--   1. hr_offices                 — canonical Trustner office list (5 offices)
--   2. hr_holidays.office_codes   — array of office codes the holiday applies to;
--                                    NULL/empty = all offices (default)
--   3. hr_employees.office_code   — link an employee to their primary office,
--                                    used to filter their visible holidays
--   4. Backfill: existing single-string `office_location` rows roll up to array

-- ────────────────────────────────────────────────────────────────
-- Office master (5 Trustner offices per COMPANY constants)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_offices (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  entity TEXT CHECK (entity IN ('TAS','TIB','BOTH')) DEFAULT 'BOTH',
  is_active BOOLEAN DEFAULT true,
  -- For Phase 4 attendance geofencing (lat/lng of office, radius in metres)
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  geofence_radius_m INT DEFAULT 200,
  -- Display order on UI lists
  sort_order INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Trustner offices — source of truth: src/lib/constants/company.ts
INSERT INTO hr_offices (code, name, city, state, entity, sort_order) VALUES
  ('HO_GHY',  'Head Office',      'Guwahati',  'Assam',       'BOTH', 10),
  ('BR_TEZ',  'Branch Office',    'Tezpur',    'Assam',       'BOTH', 20),
  ('CO_BLR',  'Corporate Office', 'Bangalore', 'Karnataka',   'BOTH', 30),
  ('RO_KOL',  'Regional Office',  'Kolkata',   'West Bengal', 'BOTH', 40),
  ('BR_HYD',  'Branch Office',    'Hyderabad', 'Telangana',   'BOTH', 50)
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- Holiday location scoping
-- office_codes is an array of hr_offices.code.
-- NULL or empty array = holiday applies to ALL offices (e.g. Republic Day).
-- Non-empty array     = holiday applies only to the listed offices
--                       (e.g. Bohag Bihu → ['HO_GHY','BR_TEZ'] only).
-- ────────────────────────────────────────────────────────────────
ALTER TABLE hr_holidays
  ADD COLUMN IF NOT EXISTS office_codes TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS hr_holiday_office_codes_idx
  ON hr_holidays USING GIN (office_codes);

-- Backfill: existing rows where office_location is set roll up into array
UPDATE hr_holidays
SET office_codes = ARRAY[
  CASE office_location
    WHEN 'Guwahati'  THEN 'HO_GHY'
    WHEN 'Tezpur'    THEN 'BR_TEZ'
    WHEN 'Bangalore' THEN 'CO_BLR'
    WHEN 'Kolkata'   THEN 'RO_KOL'
    WHEN 'Hyderabad' THEN 'BR_HYD'
    ELSE office_location
  END
]
WHERE office_location IS NOT NULL AND office_codes IS NULL;

-- Backfill regional holidays based on state (Assam-tagged → Guwahati + Tezpur only)
UPDATE hr_holidays
SET office_codes = ARRAY['HO_GHY','BR_TEZ']
WHERE state = 'Assam' AND type = 'regional' AND office_codes IS NULL;

-- ────────────────────────────────────────────────────────────────
-- Employee → office link
-- ────────────────────────────────────────────────────────────────
ALTER TABLE hr_employees
  ADD COLUMN IF NOT EXISTS office_code TEXT REFERENCES hr_offices(code);

CREATE INDEX IF NOT EXISTS hr_emp_office_idx ON hr_employees(office_code);

-- ────────────────────────────────────────────────────────────────
-- View: holidays applicable per office
-- Convenience view that explodes holidays per office for easy querying.
-- For an "all offices" holiday (office_codes IS NULL), the holiday is
-- joined against every active office.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW hr_holidays_per_office AS
SELECT
  h.id,
  h.fy,
  h.holiday_date,
  h.name,
  h.type,
  h.entity,
  h.state,
  h.description,
  o.code AS office_code,
  o.name AS office_name,
  o.city,
  COALESCE(h.office_codes IS NULL OR cardinality(h.office_codes) = 0, true) AS applies_to_all
FROM hr_holidays h
CROSS JOIN hr_offices o
WHERE
  (h.office_codes IS NULL OR cardinality(h.office_codes) = 0 OR o.code = ANY(h.office_codes))
  AND o.is_active = true;

-- ────────────────────────────────────────────────────────────────
-- Helper RPC: increment used balance on leave approval
-- (referenced by /api/employee/hr/leave PATCH)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hr_apply_leave_balance(
  p_employee_id BIGINT,
  p_leave_type_id BIGINT,
  p_fy TEXT,
  p_days NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO hr_leave_balances (employee_id, leave_type_id, fy, used)
  VALUES (p_employee_id, p_leave_type_id, p_fy, p_days)
  ON CONFLICT (employee_id, leave_type_id, fy)
  DO UPDATE SET used = hr_leave_balances.used + p_days,
                updated_at = now();
END;
$$ LANGUAGE plpgsql;
