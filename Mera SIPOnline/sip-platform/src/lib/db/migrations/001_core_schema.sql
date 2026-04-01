-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER MIS — Core Database Schema
-- Version: 1.0 | Date: 2026-04-01
-- Database: PostgreSQL (Supabase)
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── EMPLOYEES ───
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    auth_pin_hash VARCHAR(200), -- bcrypt hash of 4-6 digit PIN
    doj DATE NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(50),
    job_responsibility TEXT,
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    entity VARCHAR(10) CHECK (entity IN ('TIB', 'TAS', 'Vendor')),
    annual_ctc DECIMAL(14,2) DEFAULT 0,
    tenure_years DECIMAL(5,2) DEFAULT 0,
    level_code VARCHAR(5) CHECK (level_code IN ('L1','L2','L3','L4','L5','L6','L7')),
    segment VARCHAR(50) CHECK (segment IN ('Direct Sales', 'FP Team', 'CDM/POSP RM', 'Area Manager', 'Support')),
    reporting_manager_id INT REFERENCES employees(id),
    location VARCHAR(50),
    target_multiplier DECIMAL(5,2) DEFAULT 0,
    monthly_target DECIMAL(14,2) DEFAULT 0,
    annual_target DECIMAL(14,2) DEFAULT 0,
    cost_recovery_min DECIMAL(14,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_entity ON employees(entity, is_active);
CREATE INDEX idx_employees_segment ON employees(segment, is_active);
CREATE INDEX idx_employees_manager ON employees(reporting_manager_id);
CREATE INDEX idx_employees_code ON employees(employee_code);

-- ─── PRODUCTS ───
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    product_category VARCHAR(50) CHECK (product_category IN ('Life', 'Health', 'GI Motor', 'GI Non-Motor', 'MF')),
    tier INT CHECK (tier IN (1, 2, 3)),
    commission_range VARCHAR(20),
    credit_pct DECIMAL(8,4) NOT NULL,
    referral_credit_pct DECIMAL(5,2) DEFAULT 0,
    is_motor BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHANNELS ───
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(30) CHECK (channel_type IN ('Direct', 'POSP Normal', 'POSP Higher Pay', 'Sub-broker', 'Franchise', 'Digital Platform')),
    payout_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
    company_margin_pct DECIMAL(5,2) GENERATED ALWAYS AS (100 - payout_pct) STORED,
    posp_code VARCHAR(30),
    managed_by_rm_id INT REFERENCES employees(id),
    grade VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    monthly_min_business DECIMAL(12,2) DEFAULT 20000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_rm ON channels(managed_by_rm_id, is_active);

-- ─── BUSINESS ENTRIES ───
CREATE TABLE IF NOT EXISTS business_entries (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    product_id INT REFERENCES products(id) NOT NULL,
    channel_id INT REFERENCES channels(id), -- NULL for direct business
    raw_amount DECIMAL(14,2) NOT NULL,
    product_credit_pct DECIMAL(8,4) NOT NULL,
    channel_payout_pct DECIMAL(5,2) DEFAULT 0,
    company_margin_pct DECIMAL(5,2) DEFAULT 100,
    tier_multiplier DECIMAL(5,2) NOT NULL,
    weighted_amount DECIMAL(14,2) NOT NULL, -- computed at entry time
    is_fp_route BOOLEAN DEFAULT false,
    policy_number VARCHAR(50),
    client_name VARCHAR(100),
    client_pan VARCHAR(20),
    insurer VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    approved_by INT REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_by INT REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biz_emp_month ON business_entries(employee_id, month);
CREATE INDEX idx_biz_month_status ON business_entries(month, status);
CREATE INDEX idx_biz_product ON business_entries(product_id);

-- ─── SIP TRACKER (Clawback) ───
CREATE TABLE IF NOT EXISTS sip_tracker (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    client_name VARCHAR(100),
    client_pan VARCHAR(20),
    sip_amount DECIMAL(12,2) NOT NULL,
    sip_start_date DATE,
    sip_status VARCHAR(20) DEFAULT 'Active' CHECK (sip_status IN ('Active', 'Stopped', 'Redeemed')),
    stopped_date DATE,
    clawback_applied_month VARCHAR(7),
    clawback_amount DECIMAL(12,2) DEFAULT 0,
    fund_name VARCHAR(100),
    folio_number VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sip_emp ON sip_tracker(employee_id, sip_status);

-- ─── MONTHLY INCENTIVE SNAPSHOTS ───
CREATE TABLE IF NOT EXISTS monthly_incentive_snapshots (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    month VARCHAR(7) NOT NULL,
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
    performance_status VARCHAR(20),
    is_frozen BOOLEAN DEFAULT false,
    frozen_at TIMESTAMPTZ,
    frozen_by INT REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

CREATE INDEX idx_incentive_emp_month ON monthly_incentive_snapshots(employee_id, month);

-- ─── TRAIL INCOME ───
CREATE TABLE IF NOT EXISTS trail_income (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    client_pan VARCHAR(20),
    client_name VARCHAR(100),
    client_type VARCHAR(20) CHECK (client_type IN ('New PAN', 'Existing Client')),
    channel_type VARCHAR(30),
    starting_aum DECIMAL(16,2) DEFAULT 0,
    current_aum DECIMAL(16,2) DEFAULT 0,
    incremental_aum DECIMAL(16,2) GENERATED ALWAYS AS (GREATEST(current_aum - starting_aum, 0)) STORED,
    eligible_trail_rate DECIMAL(8,4),
    actual_rm_trail_pct DECIMAL(8,4),
    annual_trail_income DECIMAL(14,2),
    monthly_trail_income DECIMAL(14,2),
    is_frozen BOOLEAN DEFAULT false,
    assigned_date DATE,
    last_new_business_date DATE,
    quarters_no_new_biz INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trail_emp ON trail_income(employee_id);

-- ─── INCENTIVE SLABS (Configurable) ───
CREATE TABLE IF NOT EXISTS incentive_slabs (
    id SERIAL PRIMARY KEY,
    slab_table_name VARCHAR(30) NOT NULL CHECK (slab_table_name IN ('DST', 'POSP_RM')),
    achievement_min DECIMAL(5,2) NOT NULL,
    achievement_max DECIMAL(5,2),
    incentive_rate DECIMAL(5,2) NOT NULL,
    multiplier DECIMAL(5,2) NOT NULL,
    slab_label VARCHAR(30),
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    version VARCHAR(10) DEFAULT 'v1.0'
);

-- ─── AUDIT LOG ───
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'FREEZE')),
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    reason TEXT
);

CREATE INDEX idx_audit_table_action ON audit_log(table_name, action, changed_at DESC);
CREATE INDEX idx_audit_changed_by ON audit_log(changed_by, changed_at DESC);

-- ─── ADMIN CONTROLS ───
CREATE TABLE IF NOT EXISTS admin_controls (
    id SERIAL PRIMARY KEY,
    control_key VARCHAR(50) UNIQUE NOT NULL,
    control_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_controls (control_key, control_value, description) VALUES
('current_month', '2026-04', 'Active calculation month'),
('incentive_lock', 'false', 'Lock all incentive calculations'),
('slab_version', 'v1.0', 'Current slab table version'),
('trail_freeze_quarters', '2', 'Quarters of no new biz before trail freezes'),
('min_deferred_threshold', '50000', 'Minimum bonus for 60/40 split')
ON CONFLICT (control_key) DO NOTHING;

-- ─── Trigger: Auto-update updated_at ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_business_entries_updated_at
    BEFORE UPDATE ON business_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
