-- ============================================================
-- Trustner4u MIS — Supabase Table Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. MIS Import metadata
CREATE TABLE IF NOT EXISTS mis_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  file_name TEXT,
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMPTZ DEFAULT now(),
  gi_count INT DEFAULT 0,
  health_count INT DEFAULT 0,
  life_count INT DEFAULT 0,
  mf_count INT DEFAULT 0,
  mtd_count INT DEFAULT 0,
  UNIQUE(month, year)
);

-- 2. GI Policies
CREATE TABLE IF NOT EXISTS mis_gi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES mis_imports(id) ON DELETE CASCADE,
  sl_no INT,
  entry_date TEXT,
  month TEXT,
  customer_name TEXT,
  contact_no TEXT,
  company TEXT,
  policy_no TEXT,
  referred_by TEXT,
  business_closed_by TEXT,
  posp_name TEXT,
  policy_type TEXT,
  motor_policy_type TEXT,
  sub_type TEXT,
  from_date TEXT,
  to_date TEXT,
  od_premium FLOAT DEFAULT 0,
  tp_premium FLOAT DEFAULT 0,
  net_premium FLOAT DEFAULT 0,
  status TEXT,
  issued_date TEXT,
  agency_broker TEXT,
  employee_location TEXT
);

-- 3. Health Policies
CREATE TABLE IF NOT EXISTS mis_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES mis_imports(id) ON DELETE CASCADE,
  month TEXT,
  date TEXT,
  customer_name TEXT,
  ref_no TEXT,
  product TEXT,
  ped TEXT,
  payment_date TEXT,
  premium FLOAT DEFAULT 0,
  remarks TEXT,
  advisor_name TEXT,
  login_mode TEXT,
  payment_method TEXT,
  given_by TEXT,
  business_closed_by TEXT,
  posp_name TEXT,
  company_name TEXT,
  credit_percent FLOAT DEFAULT 0,
  issued_date TEXT,
  employee_location TEXT,
  status TEXT
);

-- 4. Life Policies
CREATE TABLE IF NOT EXISTS mis_life (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES mis_imports(id) ON DELETE CASCADE,
  month TEXT,
  date TEXT,
  customer_name TEXT,
  advisor_name TEXT,
  given_by TEXT,
  closed_by TEXT,
  posp_name TEXT,
  policy_no TEXT,
  base_premium FLOAT DEFAULT 0,
  total_premium FLOAT DEFAULT 0,
  payment_type TEXT,
  sum_assured FLOAT DEFAULT 0,
  ppt INT DEFAULT 0,
  pt INT DEFAULT 0,
  frequency TEXT,
  type TEXT,
  payment_mode TEXT,
  cash_online TEXT,
  product TEXT,
  company TEXT,
  status TEXT,
  issued_date TEXT,
  is_direct BOOLEAN DEFAULT false,
  credit_pct FLOAT DEFAULT 0
);

-- 5. MF Transactions
CREATE TABLE IF NOT EXISTS mis_mf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES mis_imports(id) ON DELETE CASCADE,
  sl_no INT,
  month TEXT,
  transaction_date TEXT,
  can_pan_no TEXT,
  advisor TEXT,
  sales TEXT,
  client_type TEXT,
  client_name TEXT,
  txn_type TEXT,
  txn_sub_type TEXT,
  folio_number TEXT,
  scheme_name TEXT,
  amount FLOAT DEFAULT 0,
  sip_date TEXT
);

-- 6. MTD Performance
CREATE TABLE IF NOT EXISTS mis_mtd (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES mis_imports(id) ON DELETE CASCADE,
  region TEXT,
  manager TEXT,
  name TEXT,
  role TEXT,
  target FLOAT DEFAULT 0,
  sip FLOAT DEFAULT 0,
  ls FLOAT DEFAULT 0,
  gi FLOAT DEFAULT 0,
  life FLOAT DEFAULT 0,
  health FLOAT DEFAULT 0,
  posp FLOAT DEFAULT 0,
  ftd_new_call FLOAT DEFAULT 0,
  ftd_follow_up FLOAT DEFAULT 0,
  total_business FLOAT DEFAULT 0,
  achievement FLOAT DEFAULT 0
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE mis_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_gi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_mf ENABLE ROW LEVEL SECURITY;
ALTER TABLE mis_mtd ENABLE ROW LEVEL SECURITY;

-- SELECT policies — all authenticated users can read
CREATE POLICY "Authenticated users can read mis_imports" ON mis_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mis_gi" ON mis_gi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mis_health" ON mis_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mis_life" ON mis_life FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mis_mf" ON mis_mf FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mis_mtd" ON mis_mtd FOR SELECT TO authenticated USING (true);

-- INSERT policies — all authenticated users can import
CREATE POLICY "Authenticated users can insert mis_imports" ON mis_imports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert mis_gi" ON mis_gi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert mis_health" ON mis_health FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert mis_life" ON mis_life FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert mis_mf" ON mis_mf FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert mis_mtd" ON mis_mtd FOR INSERT TO authenticated WITH CHECK (true);

-- DELETE policies — allow re-import by deleting old data
CREATE POLICY "Authenticated users can delete mis_imports" ON mis_imports FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mis_gi" ON mis_gi FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mis_health" ON mis_health FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mis_life" ON mis_life FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mis_mf" ON mis_mf FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete mis_mtd" ON mis_mtd FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Indexes for common queries
-- ============================================================

CREATE INDEX idx_mis_gi_import ON mis_gi(import_id);
CREATE INDEX idx_mis_health_import ON mis_health(import_id);
CREATE INDEX idx_mis_life_import ON mis_life(import_id);
CREATE INDEX idx_mis_mf_import ON mis_mf(import_id);
CREATE INDEX idx_mis_mtd_import ON mis_mtd(import_id);
CREATE INDEX idx_mis_imports_month_year ON mis_imports(month, year);
