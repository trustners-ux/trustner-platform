-- ═══════════════════════════════════════════════════════════════
-- TRUSTNER MIS — Seed Data (Employees + Products + Slabs + Channels)
-- Run AFTER 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── EMPLOYEES (23 active) ───
INSERT INTO employees (id, employee_code, name, email, phone, doj, designation, department, gross_salary, entity, annual_ctc, tenure_years, level_code, segment, target_multiplier, monthly_target, annual_target, cost_recovery_min, is_active) VALUES
-- L1 Directors
(1, 'TAS001', 'Ram Shah', 'ram@trustner.in', '9864051214', '2018-01-01', 'Director & CFP', 'Management', 0, 'TAS', 0, 8, 'L1', 'Direct Sales', 0, 0, 0, 0, true),
(2, 'TIB001', 'Sangita Shah', 'sangeeta@trustner.in', NULL, '2018-01-01', 'Director', 'Management', 0, 'TIB', 0, 8, 'L1', 'Direct Sales', 0, 0, 0, 0, true),
-- L2 CDO
(3, 'TIB002', 'Abir Das', NULL, NULL, '2019-06-15', 'CDO', 'Sales - Insurance', 300000, 'TIB', 3600000, 6.8, 'L2', 'Direct Sales', 6, 1800000, 21600000, 480000, true),
-- L3 VP / Regional
(4, 'TIB003', 'Subhasish Kar', NULL, NULL, '2020-04-01', 'VP - Institutional Sales', 'Sales - GI', 120000, 'TIB', 1440000, 6, 'L3', 'Direct Sales', 6, 720000, 8640000, 192000, true),
(5, 'TIB004', 'Rafiquddin Ahmed', NULL, NULL, '1988-01-01', 'Consultant — GI Team', 'Sales - GI', 80000, 'TIB', 960000, 38, 'L3', 'Direct Sales', 6, 480000, 5760000, 128000, true),
-- L4 Area Manager / Branch Head
(6, 'TAS002', 'Tamanna Somani', NULL, NULL, '2021-07-01', 'Head HNI Division', 'Sales - MF', 75000, 'TAS', 900000, 4.7, 'L4', 'Direct Sales', 6, 450000, 5400000, 120000, true),
(7, 'TIB005', 'Raju Chakraborty', NULL, NULL, '2001-05-01', 'Regional Manager North East', 'Sales - CDM', 50000, 'TIB', 600000, 25, 'L4', 'CDM/POSP RM', 20, 1000000, 12000000, 80000, true),
-- L5 Sr. RM / Team Leader
(8, 'TIB006', 'Priya Sharma', NULL, NULL, '2022-03-15', 'Sr. RM - Life', 'Sales - Life', 45000, 'TIB', 540000, 4, 'L5', 'Direct Sales', 6, 270000, 3240000, 72000, true),
(9, 'TIB007', 'Arjun Dey', NULL, NULL, '2022-06-01', 'Sr. RM - Health', 'Sales - Health', 42000, 'TIB', 504000, 3.8, 'L5', 'Direct Sales', 6, 252000, 3024000, 67200, true),
(10, 'TAS003', 'Neha Agarwal', NULL, NULL, '2022-09-01', 'Team Leader - MF', 'Sales - MF', 40000, 'TAS', 480000, 3.5, 'L5', 'Direct Sales', 6, 240000, 2880000, 64000, true),
-- L6 RM / Executive
(11, 'TIB008', 'Rohit Kalita', NULL, NULL, '2023-01-15', 'RM - Life', 'Sales - Life', 35000, 'TIB', 420000, 3.2, 'L6', 'Direct Sales', 6, 210000, 2520000, 56000, true),
(12, 'TIB009', 'Sanjay Bora', NULL, NULL, '2023-04-01', 'RM - Health', 'Sales - Health', 32000, 'TIB', 384000, 3, 'L6', 'Direct Sales', 6, 192000, 2304000, 51200, true),
(13, 'TIB010', 'Ankita Das', NULL, NULL, '2023-06-15', 'RM - CDM', 'Sales - CDM', 30000, 'TIB', 360000, 2.8, 'L6', 'CDM/POSP RM', 20, 600000, 7200000, 48000, true),
(14, 'TAS004', 'Vikram Choudhury', NULL, NULL, '2023-08-01', 'RM - MF', 'Sales - MF', 30000, 'TAS', 360000, 2.6, 'L6', 'Direct Sales', 6, 180000, 2160000, 48000, true),
(15, 'TIB011', 'Meena Baruah', NULL, NULL, '2024-01-10', 'RM - GI Motor', 'Sales - GI', 28000, 'TIB', 336000, 2.2, 'L6', 'Direct Sales', 6, 168000, 2016000, 44800, true),
(16, 'TIB012', 'Deepak Nath', NULL, NULL, '2024-03-01', 'RM - CDM', 'Sales - CDM', 25000, 'TIB', 300000, 2, 'L6', 'CDM/POSP RM', 20, 500000, 6000000, 40000, true),
-- L7 Junior RM / Support
(17, 'TIB013', 'Ritika Gogoi', NULL, NULL, '2024-08-01', 'Jr. RM - Life', 'Sales - Life', 22000, 'TIB', 264000, 1.6, 'L7', 'Direct Sales', 6, 132000, 1584000, 35200, true),
(18, 'TIB014', 'Amir Hussain', NULL, NULL, '2024-10-01', 'Jr. RM - Health', 'Sales - Health', 20000, 'TIB', 240000, 1.4, 'L7', 'Direct Sales', 6, 120000, 1440000, 32000, true),
-- Support Staff
(19, 'TIB015', 'Pooja Saikia', NULL, NULL, '2021-04-01', 'Sr. Operations Executive', 'Operations', 28000, 'TIB', 336000, 5, 'L7', 'Support', 0, 0, 0, 44800, true),
(20, 'TIB016', 'Rakesh Thakur', NULL, NULL, '2022-07-01', 'Accounts Executive', 'Accounts', 25000, 'TIB', 300000, 3.7, 'L7', 'Support', 0, 0, 0, 40000, true),
(21, 'TIB017', 'Sunita Roy', NULL, NULL, '2023-02-01', 'HR Executive', 'HR', 22000, 'TIB', 264000, 3.1, 'L7', 'Support', 0, 0, 0, 35200, true),
(22, 'TIB018', 'Kamal Hazarika', NULL, NULL, '2023-09-01', 'Training Manager', 'Training', 30000, 'TIB', 360000, 2.5, 'L6', 'Support', 0, 0, 0, 48000, true),
(23, 'TAS005', 'Divya Bharali', NULL, NULL, '2024-04-01', 'Digital Marketing Executive', 'Digital & IT', 25000, 'TAS', 300000, 2, 'L7', 'Support', 0, 0, 0, 40000, true)
ON CONFLICT (employee_code) DO NOTHING;

-- Reset sequence to avoid ID conflicts
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- ─── PRODUCTS (18) ───
INSERT INTO products (id, product_name, product_category, tier, commission_range, credit_pct, referral_credit_pct, is_motor, notes) VALUES
-- Tier 1 (>30%, 100% multiplier)
(1, 'Life Regular 10yr+', 'Life', 1, '>30%', 125, 15, false, 'Long-term regular premium bonus'),
(2, 'Health Fresh (Annual)', 'Health', 1, '>30%', 100, 10, false, NULL),
(3, 'Health Long-Term 2yr', 'Health', 1, '>30%', 62.5, 10, false, 'Prem/2 × 125%'),
(4, 'Health Long-Term 3yr', 'Health', 1, '>30%', 50, 10, false, 'Prem/3 × 150%'),
(5, 'GI Non-Motor', 'GI Non-Motor', 1, '>30%', 100, 7.5, false, NULL),
-- Tier 2 (15-30%, 75% multiplier)
(6, 'Life Regular <10yr', 'Life', 2, '15-30%', 100, 15, false, NULL),
(7, 'Health Port/Renewal', 'Health', 2, '15-30%', 33, 7.5, false, NULL),
(8, 'GI Motor Private Car', 'GI Motor', 2, '15-30%', 100, 0, true, NULL),
(9, 'GI Motor CV (LCV/HCV)', 'GI Motor', 2, '15-30%', 100, 0, true, NULL),
-- Tier 3 (<15%, 50% multiplier)
(10, 'Life ULIP', 'Life', 3, '<15%', 25, 0, false, NULL),
(11, 'Life Single Premium', 'Life', 3, '<15%', 10, 0, false, NULL),
(12, 'Health Quarterly/HY', 'Health', 3, '<15%', 50, 0, false, NULL),
(13, 'MF SIP (Monthly)', 'MF', 3, '<15%', 100, 0, false, '100% of MONTHLY collection ONLY. NO x12 annualization.'),
(14, 'MF Lumpsum Equity', 'MF', 3, '<15%', 10, 0, false, NULL),
(15, 'MF Lumpsum Debt', 'MF', 3, '<15%', 7.5, 0, false, NULL),
(16, 'GI Motor TP Only', 'GI Motor', 3, '<15%', 100, 0, true, NULL),
(17, 'GI GMC/GPA', 'GI Non-Motor', 3, '<15%', 20, 0, false, NULL),
(18, 'MF Debt→Equity via STP', 'MF', 3, '<15%', 10, 0, false, NULL)
ON CONFLICT DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ─── INCENTIVE SLABS ───
-- DST (Direct Sales Team) — margin ≥30%
INSERT INTO incentive_slabs (slab_table_name, achievement_min, achievement_max, incentive_rate, multiplier, slab_label) VALUES
('DST', 0, 79.99, 0, 0, 'No Incentive'),
('DST', 80, 100, 4, 1.0, 'Base 4%'),
('DST', 100.01, 110, 5, 1.25, 'Enhanced 5%'),
('DST', 110.01, 130, 6, 1.5, 'Super 6%'),
('DST', 130.01, 150, 7, 1.75, 'Star 7%'),
('DST', 150.01, NULL, 8, 2.0, 'Champion 8%');

-- POSP RM — manages sub-brokers/POSPs (70/30 margin)
INSERT INTO incentive_slabs (slab_table_name, achievement_min, achievement_max, incentive_rate, multiplier, slab_label) VALUES
('POSP_RM', 0, 79.99, 0, 0, 'No Incentive'),
('POSP_RM', 80, 100, 1.2, 1.0, 'Base 1.2%'),
('POSP_RM', 100.01, 110, 1.5, 1.25, 'Enhanced 1.5%'),
('POSP_RM', 110.01, 130, 1.8, 1.5, 'Super 1.8%'),
('POSP_RM', 130.01, 150, 2.1, 1.75, 'Star 2.1%'),
('POSP_RM', 150.01, NULL, 2.4, 2.0, 'Champion 2.4%');

-- ─── CHANNELS (Sample) ───
INSERT INTO channels (channel_name, channel_type, payout_pct, managed_by_rm_id, grade, is_active) VALUES
('Direct (Firm Code)', 'Direct', 0, NULL, NULL, true),
('POSP Grade A - Standard', 'POSP Normal', 70, 7, 'A', true),
('POSP Grade B - Higher Pay', 'POSP Higher Pay', 80, 7, 'B', true),
('Digital Platform POSP', 'Digital Platform', 80, 13, NULL, true),
('Sub-Broker NE Region', 'Sub-broker', 60, 7, NULL, true),
('Franchise Partner - Guwahati', 'Franchise', 85, 16, NULL, true)
ON CONFLICT DO NOTHING;

-- ─── SAMPLE BUSINESS ENTRIES (April 2026) ───
INSERT INTO business_entries (employee_id, month, product_id, raw_amount, product_credit_pct, channel_payout_pct, company_margin_pct, tier_multiplier, weighted_amount, is_fp_route, client_name, insurer, policy_number, status, created_by) VALUES
-- Abir Das (CDO)
(3, '2026-04', 1, 150000, 125, 0, 100, 100, 187500, false, 'Rajesh Gupta', 'TATA AIA', 'TAIA-2026-001', 'approved', 3),
(3, '2026-04', 2, 85000, 100, 0, 100, 100, 85000, false, 'Priya Menon', 'Star Health', 'STAR-2026-042', 'approved', 3),
(3, '2026-04', 5, 120000, 100, 0, 100, 100, 120000, false, 'Vikram Industries', 'ICICI Lombard', 'ICL-2026-019', 'approved', 3),
(3, '2026-04', 13, 25000, 100, 0, 100, 50, 12500, false, 'Multiple SIPs', NULL, NULL, 'submitted', 3),
-- Subhasish Kar (VP)
(4, '2026-04', 5, 250000, 100, 0, 100, 100, 250000, false, 'ABC Corporation', 'New India', 'NIA-2026-108', 'approved', 4),
(4, '2026-04', 17, 180000, 20, 0, 100, 50, 36000, false, 'XYZ Group', 'ICICI Lombard', 'ICL-GPA-2026-05', 'approved', 4),
(4, '2026-04', 8, 95000, 100, 0, 100, 75, 71250, false, 'Fleet Motors', 'Bajaj Allianz', 'BAL-MV-2026-33', 'submitted', 4),
-- Tamanna Somani (HNI)
(6, '2026-04', 13, 50000, 100, 0, 100, 50, 25000, false, 'HNI SIPs', NULL, NULL, 'approved', 6),
(6, '2026-04', 14, 500000, 10, 0, 100, 50, 25000, false, 'Dr. Sharma', NULL, NULL, 'approved', 6),
(6, '2026-04', 2, 75000, 100, 0, 100, 100, 75000, false, 'Amit Agarwal Family', 'Niva Bupa', 'NB-2026-099', 'approved', 6),
(6, '2026-04', 1, 100000, 125, 0, 100, 100, 156250, true, 'S. Bhattacharya', 'HDFC Life', 'HDFC-L-2026-44', 'approved', 6),
-- Raju Chakraborty (CDM/POSP RM)
(7, '2026-04', 2, 200000, 100, 70, 30, 100, 60000, false, 'POSP Business', NULL, NULL, 'approved', 7),
(7, '2026-04', 8, 150000, 100, 70, 30, 75, 33750, false, 'POSP Motor', NULL, NULL, 'submitted', 7),
(7, '2026-04', 1, 80000, 125, 0, 100, 100, 100000, false, 'Self-sourced Life', NULL, NULL, 'approved', 7),
-- Priya Sharma (Sr. RM)
(8, '2026-04', 1, 120000, 125, 0, 100, 100, 150000, false, 'Ratan Sinha', 'Max Life', 'MAX-2026-078', 'approved', 8),
(8, '2026-04', 6, 60000, 100, 0, 100, 75, 45000, false, 'Deepa Choudhury', 'ICICI Pru', 'IPRU-2026-033', 'submitted', 8),
-- Arjun Dey (Sr. RM Health)
(9, '2026-04', 2, 95000, 100, 0, 100, 100, 95000, false, 'Kamal Bora', 'Care Health', 'CARE-2026-156', 'approved', 9),
(9, '2026-04', 3, 120000, 62.5, 0, 100, 100, 75000, false, 'Nirmala Family', 'Star Health', 'STAR-2Y-2026-08', 'approved', 9),
(9, '2026-04', 7, 45000, 33, 0, 100, 75, 11138, false, 'Renewal batch', 'Niva Bupa', NULL, 'submitted', 9),
-- Neha Agarwal (TL MF)
(10, '2026-04', 13, 80000, 100, 0, 100, 50, 40000, false, 'Monthly SIPs (15 clients)', NULL, NULL, 'approved', 10),
(10, '2026-04', 14, 300000, 10, 0, 100, 50, 15000, false, 'Lumpsum Equity', NULL, NULL, 'approved', 10),
(10, '2026-04', 15, 200000, 7.5, 0, 100, 50, 7500, false, 'Debt Lumpsum', NULL, NULL, 'submitted', 10),
-- Rohit Kalita (RM Life)
(11, '2026-04', 1, 80000, 125, 0, 100, 100, 100000, false, 'Bibek Das', 'SBI Life', 'SBI-L-2026-091', 'approved', 11),
(11, '2026-04', 11, 200000, 10, 0, 100, 50, 10000, false, 'Single Premium', 'LIC', 'LIC-SP-2026-44', 'submitted', 11),
-- Vikram Choudhury (RM MF)
(14, '2026-04', 13, 45000, 100, 0, 100, 50, 22500, false, 'SIP Book', NULL, NULL, 'approved', 14),
(14, '2026-04', 14, 150000, 10, 0, 100, 50, 7500, false, 'Equity LS', NULL, NULL, 'submitted', 14),
-- Meena Baruah (RM GI Motor)
(15, '2026-04', 8, 180000, 100, 0, 100, 75, 135000, false, 'Multiple Cars', 'HDFC Ergo', NULL, 'approved', 15),
(15, '2026-04', 16, 40000, 100, 0, 100, 50, 20000, false, 'TP Only', 'New India', NULL, 'submitted', 15);
