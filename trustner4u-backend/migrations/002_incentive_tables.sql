-- ============================================================
-- Trustner4u MIS — Incentive & Compensation Tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Extend employees table with incentive-specific fields
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
  ADD COLUMN IF NOT EXISTS doj DATE,
  ADD COLUMN IF NOT EXISTS job_responsibility TEXT,
  ADD COLUMN IF NOT EXISTS gross_salary DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entity VARCHAR(10) CHECK (entity IN ('TIB', 'TAS')),
  ADD COLUMN IF NOT EXISTS annual_ctc DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_code VARCHAR(5) CHECK (level_code IN ('L1','L2','L3','L4','L5','L6','L7')),
  ADD COLUMN IF NOT EXISTS segment VARCHAR(50),
  ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS location VARCHAR(50),
  ADD COLUMN IF NOT EXISTS target_multiplier DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_target DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_target DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tenure_years DECIMAL(4,1) DEFAULT 0;

-- 2. Target Configuration
CREATE TABLE IF NOT EXISTS target_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment VARCHAR(50) NOT NULL,
  multiplier DECIMAL(5,2) NOT NULL,
  variable_expense_pct DECIMAL(5,2) DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Product Master
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  product_category VARCHAR(50),
  tier INT CHECK (tier IN (1, 2, 3)),
  commission_range VARCHAR(20),
  credit_pct DECIMAL(8,4) NOT NULL,
  referral_credit_pct DECIMAL(5,2) DEFAULT 0,
  is_motor BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Channel / POSP Master
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name VARCHAR(100) NOT NULL,
  channel_type VARCHAR(30) CHECK (channel_type IN ('Direct', 'POSP Normal', 'POSP Higher Pay', 'Sub-broker', 'Franchise', 'Digital Platform')),
  payout_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  posp_code VARCHAR(30),
  managed_by_rm UUID REFERENCES employees(id),
  grade VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  activation_date DATE,
  monthly_min_business DECIMAL(12,2) DEFAULT 20000,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Insurer Commission Grids
CREATE TABLE IF NOT EXISTS insurer_grids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_name VARCHAR(50) NOT NULL,
  product_type VARCHAR(50),
  vehicle_type VARCHAR(30),
  commission_pct DECIMAL(5,2),
  od_pct DECIMAL(5,2),
  tp_pct DECIMAL(5,2),
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Incentive Slab Tables (DST + POSP RM)
CREATE TABLE IF NOT EXISTS incentive_slabs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slab_table_name VARCHAR(30) NOT NULL,
  achievement_min DECIMAL(5,2) NOT NULL,
  achievement_max DECIMAL(5,2),
  incentive_rate DECIMAL(5,2) NOT NULL,
  multiplier DECIMAL(5,2) NOT NULL,
  slab_label VARCHAR(30),
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Monthly Business Entries
CREATE TABLE IF NOT EXISTS monthly_business (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  month DATE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  channel_id UUID REFERENCES channels(id),
  raw_amount DECIMAL(14,2) NOT NULL,
  product_credit_pct DECIMAL(8,4),
  channel_payout_pct DECIMAL(5,2) DEFAULT 0,
  company_margin_pct DECIMAL(5,2),
  margin_credit_factor DECIMAL(8,4),
  tier_multiplier DECIMAL(5,2),
  weighted_amount DECIMAL(14,2),
  is_fp_route BOOLEAN DEFAULT false,
  fp_maker_checker_status VARCHAR(20),
  fp_approved_by UUID REFERENCES employees(id),
  policy_number VARCHAR(50),
  client_name VARCHAR(100),
  client_pan VARCHAR(20),
  insurer VARCHAR(50),
  entry_source VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES employees(id),
  UNIQUE(employee_id, month, product_id, policy_number)
);

-- 8. SIP Tracker (for clawback)
CREATE TABLE IF NOT EXISTS sip_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  client_name VARCHAR(100),
  client_pan VARCHAR(20),
  sip_amount DECIMAL(12,2) NOT NULL,
  sip_start_date DATE,
  sip_status VARCHAR(20) DEFAULT 'Active',
  stopped_date DATE,
  clawback_applied_month DATE,
  clawback_amount DECIMAL(12,2) DEFAULT 0,
  fund_name VARCHAR(100),
  folio_number VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Monthly Incentive Calculation (system-generated)
CREATE TABLE IF NOT EXISTS monthly_incentive_calc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  month DATE NOT NULL,
  monthly_target DECIMAL(14,2),
  total_raw_business DECIMAL(14,2),
  total_weighted_business DECIMAL(14,2),
  sip_clawback_debit DECIMAL(14,2) DEFAULT 0,
  net_weighted_business DECIMAL(14,2),
  achievement_pct DECIMAL(8,2),
  applicable_slab VARCHAR(30),
  slab_label VARCHAR(30),
  incentive_rate DECIMAL(5,2),
  slab_multiplier DECIMAL(5,2),
  gross_incentive DECIMAL(14,2),
  compliance_factor DECIMAL(5,2) DEFAULT 1.0,
  net_incentive DECIMAL(14,2),
  trail_income DECIMAL(14,2) DEFAULT 0,
  recruitment_bonus DECIMAL(12,2) DEFAULT 0,
  activation_bonus DECIMAL(12,2) DEFAULT 0,
  motor_incentive DECIMAL(12,2) DEFAULT 0,
  referral_credit_amount DECIMAL(12,2) DEFAULT 0,
  total_payout DECIMAL(14,2),
  cost_justified BOOLEAN,
  performance_status VARCHAR(20),
  calculation_timestamp TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES employees(id),
  approval_status VARCHAR(20) DEFAULT 'system_calculated',
  calculation_details JSONB,
  UNIQUE(employee_id, month)
);

-- 10. Trail Income Tracking
CREATE TABLE IF NOT EXISTS trail_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  client_pan VARCHAR(20),
  client_name VARCHAR(100),
  client_type VARCHAR(20),
  channel_type VARCHAR(30),
  starting_aum DECIMAL(16,2) DEFAULT 0,
  current_aum DECIMAL(16,2) DEFAULT 0,
  channel_payout_pct DECIMAL(5,2) DEFAULT 0,
  eligible_trail_rate DECIMAL(8,4),
  actual_rm_trail_pct DECIMAL(8,4),
  annual_trail_income DECIMAL(14,2),
  monthly_trail_income DECIMAL(14,2),
  mgmt_share_pct DECIMAL(5,2),
  mgmt_trail_income DECIMAL(14,2),
  last_new_business_date DATE,
  is_frozen BOOLEAN DEFAULT false,
  assigned_date DATE,
  quarter_no_new_biz INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. CLV Tracking
CREATE TABLE IF NOT EXISTS clv_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  client_pan VARCHAR(20) NOT NULL,
  client_name VARCHAR(100),
  cumulative_life_premium DECIMAL(16,2) DEFAULT 0,
  cumulative_health_premium DECIMAL(16,2) DEFAULT 0,
  cumulative_gi_premium DECIMAL(16,2) DEFAULT 0,
  current_mf_aum DECIMAL(16,2) DEFAULT 0,
  running_sip_annual DECIMAL(16,2) DEFAULT 0,
  lapsed_deduction DECIMAL(16,2) DEFAULT 0,
  total_clv DECIMAL(16,2) DEFAULT 0,
  clv_tier VARCHAR(20),
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 12. Admin Controls
CREATE TABLE IF NOT EXISTS admin_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  control_key VARCHAR(50) UNIQUE NOT NULL,
  control_value TEXT NOT NULL,
  description TEXT,
  last_modified_by UUID REFERENCES employees(id),
  last_modified_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Incentive Audit Log
CREATE TABLE IF NOT EXISTS incentive_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES employees(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  ip_address VARCHAR(45),
  reason TEXT
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE target_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurer_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_business ENABLE ROW LEVEL SECURITY;
ALTER TABLE sip_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_incentive_calc ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE clv_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; authenticated users get read access to config tables
CREATE POLICY "Auth read target_config" ON target_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read channels" ON channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read insurer_grids" ON insurer_grids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read incentive_slabs" ON incentive_slabs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read admin_controls" ON admin_controls FOR SELECT TO authenticated USING (true);

-- Business entries: authenticated users can read/insert; admin manages via service key
CREATE POLICY "Auth read monthly_business" ON monthly_business FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert monthly_business" ON monthly_business FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update monthly_business" ON monthly_business FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete monthly_business" ON monthly_business FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth read sip_tracker" ON sip_tracker FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert sip_tracker" ON sip_tracker FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sip_tracker" ON sip_tracker FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read monthly_incentive_calc" ON monthly_incentive_calc FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert monthly_incentive_calc" ON monthly_incentive_calc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update monthly_incentive_calc" ON monthly_incentive_calc FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read trail_income" ON trail_income FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read clv_tracker" ON clv_tracker FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read incentive_audit_log" ON incentive_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert incentive_audit_log" ON incentive_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX idx_monthly_biz_emp_month ON monthly_business(employee_id, month);
CREATE INDEX idx_incentive_calc_emp_month ON monthly_incentive_calc(employee_id, month);
CREATE INDEX idx_trail_emp ON trail_income(employee_id);
CREATE INDEX idx_clv_emp ON clv_tracker(employee_id);
CREATE INDEX idx_sip_emp_status ON sip_tracker(employee_id, sip_status);
CREATE INDEX idx_audit_action ON incentive_audit_log(action, performed_at);
CREATE INDEX idx_employees_segment ON employees(segment, is_active);
CREATE INDEX idx_channels_rm ON channels(managed_by_rm, is_active);
CREATE INDEX idx_products_category ON products(product_category, tier);
CREATE INDEX idx_slabs_table ON incentive_slabs(slab_table_name);

-- ============================================================
-- Default Admin Controls
-- ============================================================

INSERT INTO admin_controls (control_key, control_value, description) VALUES
  ('current_month', '2026-04', 'Active calculation month'),
  ('incentive_lock', 'false', 'Lock all incentive calculations'),
  ('slab_version', 'v2.2', 'Current slab table version'),
  ('trail_freeze_quarters', '2', 'Quarters of no new biz before trail freezes'),
  ('min_deferred_threshold', '50000', 'Minimum bonus for 60/40 split'),
  ('compliance_penalty', '0.8', 'Multiplier for compliance violation'),
  ('compliance_bonus', '1.1', 'Multiplier for clean compliance'),
  ('esop_unit_price', '500', 'Current ESOP unit price'),
  ('esop_pool_pct', '5', 'ESOP pool as % of equity')
ON CONFLICT (control_key) DO NOTHING;

-- ============================================================
-- Seed: Incentive Slab Tables
-- ============================================================

-- DST (Direct Sales Team) Slabs
INSERT INTO incentive_slabs (slab_table_name, achievement_min, achievement_max, incentive_rate, multiplier, slab_label, effective_from) VALUES
  ('DST', 0, 79.99, 0, 0, 'No Incentive', '2026-04-01'),
  ('DST', 80, 100, 4, 1.0, 'Standard', '2026-04-01'),
  ('DST', 101, 110, 5, 1.25, 'Enhanced', '2026-04-01'),
  ('DST', 111, 130, 6, 1.5, 'Super', '2026-04-01'),
  ('DST', 131, 150, 7, 1.75, 'Champion', '2026-04-01'),
  ('DST', 151, 999, 8, 2.0, 'Star', '2026-04-01')
ON CONFLICT DO NOTHING;

-- POSP RM Slabs
INSERT INTO incentive_slabs (slab_table_name, achievement_min, achievement_max, incentive_rate, multiplier, slab_label, effective_from) VALUES
  ('POSP_RM', 0, 79.99, 0, 0, 'No Incentive', '2026-04-01'),
  ('POSP_RM', 80, 100, 1.2, 1.0, 'Standard', '2026-04-01'),
  ('POSP_RM', 101, 110, 1.5, 1.25, 'Enhanced', '2026-04-01'),
  ('POSP_RM', 111, 130, 1.8, 1.5, 'Super', '2026-04-01'),
  ('POSP_RM', 131, 150, 2.1, 1.75, 'Champion', '2026-04-01'),
  ('POSP_RM', 151, 999, 2.4, 2.0, 'Star', '2026-04-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Target Configuration
-- ============================================================

INSERT INTO target_config (segment, multiplier, variable_expense_pct, effective_from, notes) VALUES
  ('Direct Sales', 6, 0, '2026-04-01', 'Standard direct sales team'),
  ('FP Team', 6, 0, '2026-04-01', 'Financial planning team — same as direct'),
  ('CDM/POSP RM', 20, 0, '2026-04-01', 'Channel development managers handling POSPs'),
  ('Area Manager', 23, 15, '2026-04-01', '20× base + 15% variable for rent/staff'),
  ('Support', 0, 0, '2026-04-01', 'KPI-based bonus only — no target multiplier')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Product Master
-- ============================================================

INSERT INTO products (product_name, product_category, tier, commission_range, credit_pct, referral_credit_pct, is_motor, notes) VALUES
  -- TIER 1 (>30%, 100% credit)
  ('Life Regular 10yr+', 'Life', 1, '>30%', 125, 15, false, 'Long-term regular premium bonus'),
  ('Health Fresh Annual', 'Health', 1, '>30%', 100, 10, false, 'Standard fresh health'),
  ('Health Long-Term 2yr', 'Health', 1, '>30%', 62.5, 10, false, 'Prem/2 × 125%'),
  ('Health Long-Term 3yr', 'Health', 1, '>30%', 50, 10, false, 'Prem/3 × 150%'),
  ('GI Non-Motor', 'GI Non-Motor', 1, '>30%', 100, 7.5, false, 'Full credit'),
  ('FP Route (any product)', 'FP Route', 1, '>30%', 125, 0, false, 'Requires Maker-Checker'),

  -- TIER 2 (15-30%, 75% credit)
  ('Life Regular <10yr', 'Life', 2, '15-30%', 100, 15, false, 'Standard life'),
  ('Health Port/Renewal', 'Health', 2, '15-30%', 100, 7.5, false, 'Port-in or renewal'),
  ('GI Motor Private Car', 'GI Motor', 2, '15-30%', 100, 0, true, 'OD+TP preferred'),
  ('GI Motor CV LCV/HCV', 'GI Motor', 2, '15-30%', 100, 0, true, 'Commercial vehicle'),

  -- TIER 3 (<15%, 50% credit)
  ('Life ULIP', 'Life', 3, '<15%', 25, 0, false, 'Low margin'),
  ('Life Single Premium', 'Life', 3, '<15%', 10, 0, false, 'One-time low margin'),
  ('Health Quarterly/HY', 'Health', 3, '<15%', 50, 0, false, 'Lower commitment'),
  ('MF SIP Monthly', 'MF', 3, '<15%', 100, 0, false, '100% of MONTHLY collection ONLY'),
  ('MF Lumpsum Equity', 'MF', 3, '<15%', 10, 0, false, 'Low margin on equity LS'),
  ('MF Lumpsum LT Debt', 'MF', 3, '<15%', 7.5, 0, false, 'Medium-term debt'),
  ('MF Lumpsum ST Debt', 'MF', 3, '<15%', 5, 0, false, 'Liquid/ultra-short'),
  ('MF Debt to Equity STP', 'MF', 3, '<15%', 10, 0, false, 'Same as equity LS'),
  ('GI Motor Two Wheeler', 'GI Motor', 3, '<15%', 100, 0, true, 'Standard 2W'),
  ('GI Motor TP Only', 'GI Motor', 3, '<15%', 100, 0, true, 'TP Only — not counted for POSP activation'),
  ('GI GMC/GPA', 'GI Non-Motor', 3, '<15%', 20, 0, false, 'Very low credit'),
  ('GI Renewal', 'GI Non-Motor', 3, '<15%', 33, 0, false, 'One-third credit'),
  ('Directors Business', 'Directors', 3, '<15%', 30, 0, false, 'Business sourced by Ram/Sangita Shah')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Motor/Franchise Progressive Slabs (stored in admin_controls as JSON)
-- ============================================================

INSERT INTO admin_controls (control_key, control_value, description) VALUES
  ('motor_slabs', '[{"min":0,"max":300000,"rate":1.5},{"min":300001,"max":499999,"rate":2.0},{"min":500000,"max":null,"rate":3.0}]', 'Motor progressive incentive slabs (quarterly)'),
  ('posp_recruitment_bonus', '[{"min_posps":7,"bonus_per":200},{"min_posps":15,"bonus_per":300},{"min_posps":20,"bonus_per":500}]', 'POSP recruitment bonus tiers (monthly)'),
  ('posp_activation_bonus', '[{"min_active":7,"bonus_per":300},{"min_active":11,"bonus_per":500},{"min_active":16,"bonus_per":750},{"min_active":20,"bonus_per":1000}]', 'POSP activation bonus tiers (Grade A = ₹20K+ monthly)')
ON CONFLICT (control_key) DO NOTHING;
