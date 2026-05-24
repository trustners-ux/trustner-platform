# TRUSTNER GROUP — INCENTIVE, COMPENSATION & PERFORMANCE MANAGEMENT MIS
## Complete System Specification for Claude Code Deployment

**Company:** Trustner Group (TIB = Trustner Insurance Brokers, IRDAI-regulated; TAS = Trustner Asset Services, SEBI MFD)
**Director:** Ram Shah | Email: trustners@gmail.com
**Current Scale:** 77 employees, ₹3.91 Cr annual payroll, 10 departments, 5+ locations
**Target Scale:** 460+ employees by FY31, national presence by 2028, IPO by 2030
**Entities:** TIB (Insurance Broking — IRDAI) + TAS (Mutual Fund Distribution — SEBI)

---

## ROLE & OBJECTIVE

You are acting as CTO and MIS Coordinator for Trustner Group. Build a production-grade, web-based Incentive Management & Performance Tracking System (MIS) that:

1. **Calculates incentives automatically** using the margin-based engine described below
2. **Provides role-based dashboards** — every team member sees their own performance; no cross-employee data leakage
3. **Supports real-time tracking** — business logged today reflects in dashboard tonight
4. **Maintains SEBI/IRDAI-compliant audit trail** — every calculation logged, every override traceable
5. **Scales from 77 to 500+ employees** without architecture changes
6. **Follows global best practices** — comparable to Salesforce ICM, SAP SuccessFactors, Xactly Incent

---

## PART 1: COMPLETE BUSINESS RULES ENGINE

### 1.1 EMPLOYEE CLASSIFICATION

```
Level Codes:
  L1 = Director (Ram Shah, Sangita Shah)
  L2 = CDO / President / Vertical Head
  L3 = VP / Regional Manager / Sales Head
  L4 = Area Manager / Branch Head / CDM
  L5 = Sr. RM / Team Leader
  L6 = RM / Executive (2+ years)
  L7 = Junior RM / Support Staff

Segments:
  - Direct Sales / FP Team
  - CDM / RM handling POSP channels
  - Area Managers
  - Support / Back Office (HR, Accounts, Operations, Training, Digital)

Entities:
  - TIB (Trustner Insurance Brokers) — Insurance products
  - TAS (Trustner Asset Services) — Mutual Fund products
```

Employee Master fields: Sl No, Name, Code, DOJ, Designation, Department, Job Responsibility, Gross Salary, Entity, Annual CTC, Tenure Years, Level Code, Target Multiplier, Monthly Target, Annual Target, Cost Recovery Min, Segment, Target Notes.

### 1.2 TARGET STRUCTURE

```
Monthly Target = Multiplier × Gross Monthly Salary

Segment                    | Multiplier | Example (₹40K salary)
---------------------------|------------|----------------------
Direct Sales / FP Team     | 6×         | ₹2,40,000/month
CDM / RM handling POSP     | 20×        | ₹8,00,000/month
Area Managers              | 23×        | ₹9,20,000/month (20× base + 15% variable for rent/staff)
Support / Back Office      | N/A        | KPI-based bonus only

IMPORTANT: These are MONTHLY targets based on MONTHLY gross salary. NOT annual.
```

**Target Adjustment Formula (Margin-Based):**
```
Adjusted Target = (30% / Actual Margin%) × Base Target

Example:
  - Direct RM, 30% margin → (30/30) × 6× = 6× salary (unchanged)
  - POSP RM, 30% margin → (30/30) × 20× = 20× salary (unchanged)
  - Digital Platform, 20% margin → (30/20) × 20× = 30× salary (scaled up)
  - High-payout POSP, 5% margin → (30/5) × 20× = 120× salary (extremely hard)

Rule: If margin shrinks by 50%, target doubles and incentive slab halves.
```

### 1.3 PRODUCT TIER SYSTEM

Every product is classified into 3 tiers based on the company's commission rate:

```
Tier | Commission Range | Credit Multiplier | Description
-----|-----------------|-------------------|------------
  1  | >30%            | 100%              | High-margin products
  2  | 15-30%          | 75%               | Medium-margin products
  3  | <15%            | 50%               | Low-margin products
```

**Product-to-Tier Mapping:**
```
TIER 1 (>30%, 100% credit):
  - Life Regular 10yr+
  - Health Fresh (Annual)
  - Health Long-Term 2yr
  - Health Long-Term 3yr
  - GI Non-Motor
  - FP Route (any product) — gets 125% credit bonus

TIER 2 (15-30%, 75% credit):
  - Life Regular <10yr
  - Health Port/Renewal
  - GI Motor Private Car
  - GI Motor CV (LCV/HCV)

TIER 3 (<15%, 50% credit):
  - Life ULIP
  - Life Single Premium
  - Health Quarterly/Half-Yearly
  - MF SIP (Monthly)
  - MF Lumpsum Equity
  - MF Lumpsum Debt
  - GI Motor TP Only
  - GI GMC/GPA
```

### 1.4 PRODUCT CREDIT RULES (What counts toward target)

```
Product                     | Credit %  | Notes
----------------------------|-----------|------
MF SIP (Monthly)            | 100%      | 100% of MONTHLY collection ONLY. NO ×12 annualization.
MF Lumpsum - Equity         | 10%       | Low margin on lumpsum equity
MF Lumpsum - LT Debt        | 7.5%      | Medium-term debt funds
MF Lumpsum - ST Debt        | 5%        | Low-margin liquid/ultra-short
MF Debt→Equity via STP      | 10%       | Same as equity LS since converting
FP Route (any product)      | 125%      | BONUS: Requires complete Financial Plan + Maker-Checker
Health - Annual              | 100%      | Standard
Health - 2yr Pay             | Prem/2 × 125% | Multi-year split + bonus
Health - 3yr Pay             | Prem/3 × 150% | Multi-year split + higher bonus
Health - Quarterly/HY        | 50%       | Lower commitment
GI Non-Motor                | 100%      | Full credit
GI GMC/GPA                  | 20%       | Very low credit (low margin)
GI Renewal                  | 33%       | One-third credit
Motor                       | Grid-based | Depends on insurer commission grid
Life 10yr+ Regular           | 125%      | Long-term regular premium bonus
Life <10yr Regular           | 100%      | Standard
Life ULIP                   | 25%       | Low margin
Life Single Premium          | 10%       | One-time, low margin
Directors' Business          | 30%       | Business sourced by Ram/Sangita Shah
```

**SIP CLAWBACK RULE (CRITICAL):**
```
If any SIP gets stopped or redeemed by the client:
  → The SIP amount is DEBITED from that month's business
  → This is an anti-misselling tool
  → Applied before weighted business calculation
```

### 1.5 CHANNEL/MARGIN-BASED CREDIT (for POSP/Sub-broker/Franchise business)

```
RM Credit % = 100% − Channel Payout %

Examples:
  Channel Type           | Channel Payout | Company Margin | RM Credit
  -----------------------|----------------|----------------|----------
  Direct (Firm's Code)   | 0%             | 100%           | 100%
  Normal POSP (Grade A)  | 70%            | 30%            | 30%
  Higher Pay POSP        | 80%            | 20%            | 20%
  Digital Platform POSP  | 80%            | 20%            | 20%
  Sub-broker (standard)  | 60%            | 40%            | 40%
  Franchise              | 85%            | 15%            | 15%

After calculating RM Credit %, THEN apply Tier multiplier:
  Final Credit = Raw Business × RM Credit % × Tier Multiplier

Example: POSP brings ₹1L Health Annual (Tier 1 = 100%) through 70% payout channel:
  RM Credit = ₹1L × 30% × 100% = ₹30,000 weighted business
```

### 1.6 POSP CHANNEL RM/CDM INCENTIVE STRUCTURE

```
A. POSP Credit Rules for RM/CDM:
   - Self-business (own sourced): 300% credit (3× multiplier) — counted IN THEIR OWN TARGET
   - POSP Normal Grade: 100% credit (against their Target)
   - POSP Higher Pay Grade: Proportionately LESS (based on margin)
   - Franchise: 25% credit
   - Renewal Retention: Must be >80% to qualify for ANY incentive
   - Motor TP-Only from PSU: NOT counted for POSP activation

B. Recruitment Bonus (MONTHLY):
   POSPs Recruited | Per POSP Bonus
   7+              | ₹200
   15+             | ₹300
   20+             | ₹500

C. Activation Bonus (Grade A = minimum ₹20K monthly business):
   Active POSPs | Per POSP Bonus
   7+           | ₹300
   11+          | ₹500
   16+          | ₹750
   20+          | ₹1,000
```

### 1.7 DUAL INCENTIVE SLAB TABLES

Two separate slab tables based on whether the RM works on direct business or POSP channel:

```
TABLE A: DST (Direct Sales Team) — applies when company margin ≥30%
Achievement %  | Incentive Rate | Multiplier
<80%           | 0%             | — (NO incentive)
80-100%        | 4%             | 1.0×
101-110%       | 5%             | 1.25×
111-130%       | 6%             | 1.5×
131-150%       | 7%             | 1.75×
151%+          | 8%             | 2.0×

TABLE B: POSP RM (70/30 margin) — applies when managing sub-brokers/POSPs
Achievement %  | Incentive Rate | Multiplier
<80%           | 0%             | — (NO incentive)
80-100%        | 1.2%           | 1.0×
101-110%       | 1.5%           | 1.25×
111-130%       | 1.8%           | 1.5×
131-150%       | 2.1%           | 1.75×
151%+          | 2.4%           | 2.0×

Selection Logic:
  IF employee segment = "Direct" OR "FP Team" → use DST Slabs
  IF employee segment = "CDM" OR "POSP RM" → use POSP RM Slabs
  IF mixed → use weighted average OR the slab for primary segment
```

### 1.8 MOTOR / FRANCHISE — SITARA-STYLE PROGRESSIVE SLABS

```
Motor Insurance (paid quarterly, subject to quarterly target fulfillment):
  Business Above Target | Incentive Rate
  Up to ₹3 Lakh        | 1.5% of premium
  ₹3,00,001 - ₹4,99,999| 2% of premium
  ₹5,00,000+           | 3% of premium

GI Motor Segmentation:
  - Private Car (OD+TP) — Preferred
  - CV (LCV/HCV) — Preferred
  - Two Wheeler — Standard
  - TP Only Private Insurer — Acceptable
  - TP Only PSU — NON-preferred (not counted for POSP activation)
  - Firm's code business = DOUBLE credit

Insurer grids referenced: Shriram, TATA AIG, ICICI Lombard, SBI General, Bajaj Allianz,
  New India, United India, HDFC Ergo, Reliance, Kotak, Cholamandalam, Go Digit, Acko, Niva Bupa
```

### 1.9 TRAIL INCOME MODEL (MF — Incremental AUM Only)

```
CRITICAL RULE: Trail is calculated ONLY on incremental AUM.
Starting AUM (at the time of assignment) = EXCLUDED (0% trail).

Incremental AUM = MAX(Current Total AUM − Starting AUM, 0)

Trail Rates:
  Scenario                    | RM Trail Rate   | Mgmt Trail Rate | Company Keeps
  ----------------------------|-----------------|-----------------|-------------
  Self-Sourced (New PAN)      | 25%             | 10%             | 65%
  Self-Sourced (Existing Client)| 15%           | 10%             | 75%
  Assigned + New Business     | 15%             | 7.5%            | 77.5%
  Assigned + No New Business  | 0%              | 5%              | 95%
  Office / Walk-in            | 10%             | 10%             | 80%

Channel Adjustments:
  Sub-broker managed: 30% of the eligible trail rate
  Franchise: 10% of the eligible trail rate
  Digital Platform (80% payout): RM gets only 20% credit on trail too

FREEZE RULE: If no new business for 2 consecutive quarters → trail entitlement freezes.

Annual Trail Income = Incremental AUM × Actual RM Trail %
Monthly Trail Income = Annual Trail Income ÷ 12
```

### 1.10 NON-DIRECT REFERRAL CREDITS

```
Product Category     | Referral Credit % | Condition
---------------------|-------------------|----------
Life Insurance       | 15%               | Premium credit ≥ ₹1,00,000
Fresh Health         | 10%               | New policy only
Health Port-in       | 7.5%              | Port from competitor
GI Non-Motor         | 5-10%             | Based on company margin

Rules:
  - Referral credits counted ONCE only (no double-dipping)
  - Support staff referrals: 50% of RM's applicable referral rate
  - Referral only counts if the deal is actually closed by the assigned RM
```

### 1.11 PROFIT CENTER MODEL (Senior Management L2-L5)

```
Vertical Profit = Revenue − (Manager Salary + Team Salary + Team Incentives + Other Costs + Attrition Cost)

Level                      | Bonus % of Vertical Profit
---------------------------|---------------------------
L2 (CDO / President)       | 8-12%
L3 (VP / Regional Manager) | 5-8%
L4 (Sales Head / Branch)   | 3-5%
L5 (Area Manager)          | 2-4%

Attrition Cost Attribution:
  Exit < 3 months: 100% cost charged to hiring manager's P&L
  Exit 3-6 months: 50% cost charged to hiring manager's P&L
  Exit > 6 months (performing): No attribution

Health Metrics:
  CTI (Cost-to-Income) < 40% = Healthy
  CTI 40-60% = Warning
  CTI > 60% = Critical
  Loss-making vertical = ZERO bonus (non-negotiable)
```

### 1.12 ESOP & PHANTOM STOCK PLAN

```
Pool Size: 5% of total equity
Pre-IPO Valuation: ₹50 Crore → ₹500 per unit (100,000 total units)
Vesting: 4 years + 1 year cliff
Pre-IPO: Cash-settled phantom stock at Board-approved valuation
Post-IPO: Converts to actual ESOP
IPO Trigger: 100% accelerated vesting

Annual Grant by Level:
  L2 (CDO / Vertical Head)       → 5,000 units → ₹25,00,000 over 4 years
  L3 (Regional Mgr / Sales Head) → 3,000 units → ₹15,00,000 over 4 years
  L4 (Area Manager / CDM)        → 2,000 units → ₹10,00,000 over 4 years
  L5 (Sr. RM / Team Leader)      → 1,000 units → ₹5,00,000 over 4 years
  L6 (RM / Executive, 2+ yrs)    → 500 units   → ₹2,50,000 over 4 years
  L7 (Support, 3+ yrs)           → 250 units   → ₹1,25,000 over 4 years

Vesting Schedule:
  Year 0-1 (Cliff): 0% vested
  Year 1: 25% vests
  Year 2: 25% vests (cumulative 50%)
  Year 3: 25% vests (cumulative 75%)
  Year 4: 25% vests (cumulative 100%)
```

### 1.13 BALANCED SCORECARD (4 Dimensions)

```
Dimension   | Weight | KPIs
------------|--------|-----
Financial   | 40%    | Revenue vs Target, Profit Contribution, Cost-to-Income, New Biz Growth
Customer    | 25%    | Client NPS Score, Retention Rate, Complaint Resolution, Cross-sell Ratio
Process     | 20%    | Policy Issuance TAT, Documentation Accuracy, KYC Compliance, Mis-selling = Zero
Learning    | 15%    | Certifications Earned, Training Hours, Team Retention (Mgrs), Digital Adoption

Compliance Multiplier:
  Final Payout = Composite Score × Compliance Factor
  If ANY violation: 0.8× (20% penalty)
  If ALL clean: 1.1× (10% bonus)

Compliance Factors:
  - Zero mis-selling
  - KYC 100%
  - No regulatory observations
  - Audit >90%
  - MIS submitted on time
```

### 1.14 DEFERRED BONUS & CLAWBACK (L2-L4)

```
Split: 60% immediate / 40% deferred
Deferred released in 2 equal tranches:
  Tranche 1 (20%): After Year 1 if no clawback trigger
  Tranche 2 (20%): After Year 2 if no clawback trigger

Minimum Threshold: ₹50,000 gross bonus → below this, full immediate payout

CLAWBACK TRIGGERS:
  Trigger                              | Forfeiture %
  -------------------------------------|-------------
  Vertical underperforms vs prior year | 50%
  Compliance breach / regulatory penalty| 100%
  Mis-selling proven against team      | 100%
  Voluntary resignation before release | 100% unvested
  Team attrition >30%                  | 25%
  Fraud / embezzlement                 | 100% (ALL — including already paid)
  Data/Client confidentiality breach   | 100%
```

### 1.15 CUSTOMER LIFETIME VALUE (CLV) BONUS

```
CLV = Cumulative premiums (Life + Health + GI) + Current MF AUM + Running SIPs
      − Deductions for lapsed/stopped products

Tier      | CLV Range    | Annual Bonus
----------|-------------|-------------
Bronze    | ₹1-5 Lakh   | ₹5,000
Silver    | ₹5-15 Lakh  | ₹15,000
Gold      | ₹15-30 Lakh | ₹35,000
Platinum  | ₹30-50 Lakh | ₹60,000
Diamond   | ₹50 Lakh+   | ₹1,00,000

Team Building Bonus: ₹50,000 for managers with >90% team retention AND >100% collective target
```

### 1.16 SUPPORT TEAM BONUS STRUCTURE

```
Function      | Key Metrics                                          | Max Bonus
--------------|------------------------------------------------------|----------
Back Office   | TAT + Accuracy + Volume + Complaints + Attendance    | ₹5,000/month
Training Team | POSP activation ₹200 + ₹500/productive + ₹300/session| Variable
HR            | Time-to-hire + Retention + Payroll accuracy           | ₹8,000/quarter
Operations    | Claims TAT + Renewal follow-up + NPS                 | ₹6,000/month
Accounts      | Books closure + Reconciliation + Compliance          | ₹9,500/quarter
Digital       | Lead gen + Conversion + Social growth                | ₹5,500/month
```

### 1.17 CAREER ROADMAP & PROMOTION CRITERIA

```
Transition              | Min Tenure  | Criteria
------------------------|-------------|----------------------------------
Executive → RM          | 6 months    | 3 consecutive months at 100%+
RM → Sr. RM             | 12 months   | 4 out of 6 months at 100%+
Sr. RM → Sales Manager  | 18 months   | Annual achievement 110%+
Sales Mgr → ABM         | 12 months   | Team achievement 100%+
ABM → Area Manager      | 18 months   | 2 consecutive quarters profitable
Area Mgr → Sales Head   | 24 months   | 4 consecutive quarters profitable

Performance Allowance (monthly):
  Excellent (130%+ achievement): ₹3,000/month
  Standard (100% achievement): ₹2,000/month
  Below 100%: NIL
```

### 1.18 WEIGHTED BUSINESS CALCULATION (Master Formula)

This is the core calculation that runs for every RM every month:

```
Step 1: Raw Business Entry
  Input each product line's raw premium/business amount

Step 2: Apply Product Credit %
  Weighted amount per product = Raw amount × Product Credit % (from Section 1.4)

Step 3: Apply SIP Clawback
  If any SIP stopped/redeemed this month → DEBIT that SIP amount from total

Step 4: Apply Channel Margin Credit (for non-direct business)
  Channel-adjusted credit = Weighted amount × (100% − Channel Payout %)

Step 5: Apply Tier Multiplier
  Final weighted business = Channel-adjusted credit × Tier Multiplier (100%/75%/50%)

Step 6: Sum all product lines → Total Weighted Business for the month

Step 7: Calculate Achievement %
  Achievement % = Total Weighted Business / Monthly Target × 100

Step 8: Determine Slab
  Look up Achievement % in applicable slab table (DST or POSP RM)

Step 9: Calculate Incentive
  Incentive Amount = Total Weighted Business × Slab Incentive Rate × Slab Multiplier

Step 10: Apply Compliance Multiplier (if balanced scorecard active)
  Final Incentive = Incentive Amount × Compliance Factor (0.8× to 1.1×)
```

---

## PART 2: DATABASE SCHEMA

### 2.1 Core Tables

```sql
-- EMPLOYEES
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    doj DATE NOT NULL,
    designation VARCHAR(50),
    department VARCHAR(50),
    job_responsibility TEXT,
    gross_salary DECIMAL(12,2) NOT NULL,
    entity VARCHAR(10) CHECK (entity IN ('TIB', 'TAS')),
    annual_ctc DECIMAL(12,2),
    level_code VARCHAR(5) CHECK (level_code IN ('L1','L2','L3','L4','L5','L6','L7')),
    segment VARCHAR(50), -- 'Direct Sales', 'FP Team', 'CDM/POSP RM', 'Area Manager', 'Support'
    reporting_manager_id INT REFERENCES employees(id),
    location VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TARGET CONFIGURATION
CREATE TABLE target_config (
    id SERIAL PRIMARY KEY,
    segment VARCHAR(50) NOT NULL,
    multiplier DECIMAL(5,2) NOT NULL, -- 6, 20, 23 etc.
    variable_expense_pct DECIMAL(5,2) DEFAULT 0, -- 0.15 for Area Managers
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_by INT REFERENCES employees(id),
    notes TEXT
);

-- PRODUCT MASTER
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    product_category VARCHAR(50), -- 'Life', 'Health', 'GI Motor', 'GI Non-Motor', 'MF'
    tier INT CHECK (tier IN (1, 2, 3)),
    commission_range VARCHAR(20), -- '>30%', '15-30%', '<15%'
    credit_pct DECIMAL(8,4) NOT NULL, -- 100, 125, 10, 7.5, etc.
    referral_credit_pct DECIMAL(5,2) DEFAULT 0,
    is_motor BOOLEAN DEFAULT false,
    notes TEXT
);

-- CHANNEL / POSP MASTER
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(30) CHECK (channel_type IN ('Direct', 'POSP Normal', 'POSP Higher Pay', 'Sub-broker', 'Franchise', 'Digital Platform')),
    payout_pct DECIMAL(5,2) NOT NULL, -- 0, 70, 80, 85 etc.
    company_margin_pct DECIMAL(5,2) GENERATED ALWAYS AS (100 - payout_pct) STORED,
    posp_code VARCHAR(30),
    managed_by_rm INT REFERENCES employees(id),
    grade VARCHAR(10), -- 'A', 'B', 'C'
    is_active BOOLEAN DEFAULT true,
    activation_date DATE,
    monthly_min_business DECIMAL(12,2) DEFAULT 20000 -- Grade A minimum
);

-- INSURER COMMISSION GRIDS
CREATE TABLE insurer_grids (
    id SERIAL PRIMARY KEY,
    insurer_name VARCHAR(50) NOT NULL,
    product_type VARCHAR(50),
    vehicle_type VARCHAR(30), -- 'Pvt Car', 'CV LCV', 'CV HCV', 'Two Wheeler', 'TP Only'
    commission_pct DECIMAL(5,2),
    od_pct DECIMAL(5,2),
    tp_pct DECIMAL(5,2),
    effective_from DATE,
    effective_to DATE
);

-- INCENTIVE SLAB TABLES
CREATE TABLE incentive_slabs (
    id SERIAL PRIMARY KEY,
    slab_table_name VARCHAR(30) NOT NULL, -- 'DST', 'POSP_RM'
    achievement_min DECIMAL(5,2) NOT NULL,
    achievement_max DECIMAL(5,2), -- NULL for unlimited (151%+)
    incentive_rate DECIMAL(5,2) NOT NULL,
    multiplier DECIMAL(5,2) NOT NULL,
    slab_label VARCHAR(30),
    effective_from DATE,
    effective_to DATE
);

-- MONTHLY BUSINESS ENTRIES
CREATE TABLE monthly_business (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    month DATE NOT NULL, -- First of month (e.g., 2026-04-01)
    product_id INT REFERENCES products(id) NOT NULL,
    channel_id INT REFERENCES channels(id), -- NULL for direct
    raw_amount DECIMAL(14,2) NOT NULL,
    product_credit_pct DECIMAL(8,4),
    channel_payout_pct DECIMAL(5,2) DEFAULT 0,
    company_margin_pct DECIMAL(5,2),
    margin_credit_factor DECIMAL(8,4),
    tier_multiplier DECIMAL(5,2),
    weighted_amount DECIMAL(14,2), -- CALCULATED
    is_fp_route BOOLEAN DEFAULT false,
    fp_maker_checker_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    fp_approved_by INT REFERENCES employees(id),
    policy_number VARCHAR(50),
    client_name VARCHAR(100),
    client_pan VARCHAR(20),
    insurer VARCHAR(50),
    entry_source VARCHAR(20), -- 'manual', 'mis_upload', 'api'
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INT REFERENCES employees(id),
    UNIQUE(employee_id, month, product_id, policy_number)
);

-- SIP TRACKER (for clawback)
CREATE TABLE sip_tracker (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    client_name VARCHAR(100),
    client_pan VARCHAR(20),
    sip_amount DECIMAL(12,2) NOT NULL,
    sip_start_date DATE,
    sip_status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Stopped', 'Redeemed'
    stopped_date DATE,
    clawback_applied_month DATE, -- Month when debit was applied
    clawback_amount DECIMAL(12,2) DEFAULT 0,
    fund_name VARCHAR(100),
    folio_number VARCHAR(30)
);

-- MONTHLY INCENTIVE CALCULATION (system-generated)
CREATE TABLE monthly_incentive_calc (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    month DATE NOT NULL,
    monthly_target DECIMAL(14,2),
    total_raw_business DECIMAL(14,2),
    total_weighted_business DECIMAL(14,2),
    sip_clawback_debit DECIMAL(14,2) DEFAULT 0,
    net_weighted_business DECIMAL(14,2),
    achievement_pct DECIMAL(8,2),
    applicable_slab VARCHAR(30), -- 'DST' or 'POSP_RM'
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
    performance_status VARCHAR(20), -- 'Champion', 'Star', 'Achiever', 'Below Target', 'No Incentive'
    calculation_timestamp TIMESTAMP DEFAULT NOW(),
    approved_by INT REFERENCES employees(id),
    approval_status VARCHAR(20) DEFAULT 'system_calculated',
    UNIQUE(employee_id, month)
);

-- TRAIL INCOME TRACKING
CREATE TABLE trail_income (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    client_pan VARCHAR(20),
    client_name VARCHAR(100),
    client_type VARCHAR(20), -- 'New PAN', 'Existing Client'
    channel_type VARCHAR(30), -- 'Direct', 'Sub-broker', 'Franchise'
    starting_aum DECIMAL(16,2) DEFAULT 0, -- FROZEN at assignment
    current_aum DECIMAL(16,2) DEFAULT 0,
    incremental_aum DECIMAL(16,2) GENERATED ALWAYS AS (GREATEST(current_aum - starting_aum, 0)) STORED,
    channel_payout_pct DECIMAL(5,2) DEFAULT 0,
    eligible_trail_rate DECIMAL(8,4),
    actual_rm_trail_pct DECIMAL(8,4),
    annual_trail_income DECIMAL(14,2),
    monthly_trail_income DECIMAL(14,2),
    mgmt_share_pct DECIMAL(5,2),
    mgmt_trail_income DECIMAL(14,2),
    last_new_business_date DATE,
    is_frozen BOOLEAN DEFAULT false, -- True if no new biz for 2 quarters
    assigned_date DATE,
    quarter_no_new_biz INT DEFAULT 0
);

-- CLV TRACKING
CREATE TABLE clv_tracker (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    client_pan VARCHAR(20) NOT NULL,
    client_name VARCHAR(100),
    cumulative_life_premium DECIMAL(16,2) DEFAULT 0,
    cumulative_health_premium DECIMAL(16,2) DEFAULT 0,
    cumulative_gi_premium DECIMAL(16,2) DEFAULT 0,
    current_mf_aum DECIMAL(16,2) DEFAULT 0,
    running_sip_annual DECIMAL(16,2) DEFAULT 0,
    lapsed_deduction DECIMAL(16,2) DEFAULT 0,
    total_clv DECIMAL(16,2), -- CALCULATED
    clv_tier VARCHAR(20), -- 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ESOP GRANTS
CREATE TABLE esop_grants (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    grant_date DATE NOT NULL,
    units_granted INT NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 500,
    vesting_start_date DATE,
    cliff_end_date DATE, -- 1 year after grant
    year1_vested INT DEFAULT 0,
    year2_vested INT DEFAULT 0,
    year3_vested INT DEFAULT 0,
    year4_vested INT DEFAULT 0,
    total_vested INT DEFAULT 0,
    is_phantom BOOLEAN DEFAULT true, -- True until IPO
    current_valuation DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'Active' -- 'Active', 'Forfeited', 'Exercised'
);

-- BALANCED SCORECARD
CREATE TABLE balanced_scorecard (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    quarter VARCHAR(10), -- 'Q1FY27', 'Q2FY27' etc.
    financial_score DECIMAL(5,2), -- 0-100
    customer_score DECIMAL(5,2),
    process_score DECIMAL(5,2),
    learning_score DECIMAL(5,2),
    composite_score DECIMAL(5,2), -- Weighted: 40F + 25C + 20P + 15L
    compliance_clean BOOLEAN DEFAULT true,
    compliance_factor DECIMAL(3,2), -- 0.8 or 1.0 or 1.1
    final_adjusted_score DECIMAL(5,2),
    assessed_by INT REFERENCES employees(id),
    assessment_date DATE
);

-- DEFERRED BONUS LEDGER
CREATE TABLE deferred_bonus (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    bonus_year VARCHAR(10), -- 'FY2627'
    gross_bonus DECIMAL(14,2),
    immediate_payout DECIMAL(14,2), -- 60%
    deferred_amount DECIMAL(14,2), -- 40%
    tranche1_amount DECIMAL(14,2), -- 20%
    tranche1_due_date DATE,
    tranche1_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'released', 'clawed_back'
    tranche1_clawback_reason TEXT,
    tranche2_amount DECIMAL(14,2), -- 20%
    tranche2_due_date DATE,
    tranche2_status VARCHAR(20) DEFAULT 'pending',
    tranche2_clawback_reason TEXT
);

-- AUDIT LOG (CRITICAL FOR COMPLIANCE)
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL, -- 'incentive_calculated', 'slab_modified', 'target_overridden', etc.
    table_name VARCHAR(50),
    record_id INT,
    old_value JSONB,
    new_value JSONB,
    performed_by INT REFERENCES employees(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    reason TEXT
);

-- ADMIN CONTROLS
CREATE TABLE admin_controls (
    id SERIAL PRIMARY KEY,
    control_key VARCHAR(50) UNIQUE NOT NULL,
    control_value TEXT NOT NULL,
    description TEXT,
    last_modified_by INT REFERENCES employees(id),
    last_modified_at TIMESTAMP DEFAULT NOW()
);

-- Default admin controls
INSERT INTO admin_controls (control_key, control_value, description) VALUES
('current_month', '2026-04', 'Active calculation month'),
('incentive_lock', 'false', 'Lock all incentive calculations'),
('slab_version', 'v2.2', 'Current slab table version'),
('trail_freeze_quarters', '2', 'Quarters of no new biz before trail freezes'),
('min_deferred_threshold', '50000', 'Minimum bonus for 60/40 split'),
('compliance_penalty', '0.8', 'Multiplier for compliance violation'),
('compliance_bonus', '1.1', 'Multiplier for clean compliance'),
('super_admins', '1,2', 'Employee IDs with Super Admin access'),
('esop_unit_price', '500', 'Current ESOP unit price'),
('esop_pool_pct', '5', 'ESOP pool as % of equity');
```

### 2.2 Indexes for Performance

```sql
CREATE INDEX idx_monthly_biz_emp_month ON monthly_business(employee_id, month);
CREATE INDEX idx_incentive_calc_emp_month ON monthly_incentive_calc(employee_id, month);
CREATE INDEX idx_trail_emp ON trail_income(employee_id);
CREATE INDEX idx_clv_emp ON clv_tracker(employee_id);
CREATE INDEX idx_sip_emp_status ON sip_tracker(employee_id, sip_status);
CREATE INDEX idx_audit_action ON audit_log(action, performed_at);
CREATE INDEX idx_employees_segment ON employees(segment, is_active);
CREATE INDEX idx_channels_rm ON channels(managed_by_rm, is_active);
```

---

## PART 3: API SPECIFICATIONS

### 3.1 Authentication & Authorization

```
POST   /api/auth/login          — Email/phone + OTP login
POST   /api/auth/refresh        — Refresh JWT token
GET    /api/auth/me             — Get current user profile

RBAC Roles:
  SUPER_ADMIN  → Ram Shah, Sangita Shah — full access, override everything
  VP_PRESIDENT → L2-L3 — own vertical view, deviation approval ≤₹50K
  MANAGER      → L4-L5 — own team view, no edit
  EMPLOYEE     → L6-L7 — own data only, read-only

CRITICAL SECURITY RULE:
  Every API endpoint MUST filter by the logged-in user's scope.
  An RM can NEVER see another RM's data.
  A manager sees team AGGREGATE + individual performance, NOT salary/incentive details of peers.
  Only SUPER_ADMIN sees company margins, commission rates, insurer grids.
```

### 3.2 Employee Endpoints

```
GET    /api/employees                    — List (admin only, paginated)
GET    /api/employees/:id                — Detail (self or manager's team)
POST   /api/employees                    — Create (admin only)
PUT    /api/employees/:id                — Update (admin only)
GET    /api/employees/:id/team           — Get direct reports
GET    /api/employees/:id/hierarchy      — Get full reporting chain
```

### 3.3 Business Entry Endpoints

```
POST   /api/business/entry               — Log new business (RM or admin)
PUT    /api/business/entry/:id           — Edit (before month lock)
DELETE /api/business/entry/:id           — Delete (admin only, with audit)
GET    /api/business/my-month?month=2026-04   — My business this month
GET    /api/business/team-month?month=2026-04 — Team business (manager+)
POST   /api/business/bulk-upload         — CSV/Excel upload from insurer MIS
POST   /api/business/fp-route/submit     — Submit FP Route for Maker-Checker
PUT    /api/business/fp-route/:id/approve — Approve FP Route (Super Admin)
PUT    /api/business/fp-route/:id/reject  — Reject FP Route
```

### 3.4 Incentive Calculation Endpoints

```
POST   /api/incentive/calculate?month=2026-04        — Trigger monthly calculation (admin)
GET    /api/incentive/my-current                      — My incentive this month (real-time estimate)
GET    /api/incentive/my-history                      — My incentive history (all months)
GET    /api/incentive/team?month=2026-04              — Team incentive summary (manager+)
GET    /api/incentive/company?month=2026-04           — Company-wide summary (admin)
POST   /api/incentive/lock?month=2026-04              — Lock month (prevent edits)
POST   /api/incentive/override                        — Manual override (Super Admin + audit log)
GET    /api/incentive/slab-preview?achievement=115     — Preview: "What slab am I in?"
```

### 3.5 Trail & CLV Endpoints

```
GET    /api/trail/my-portfolio           — My trail income portfolio
GET    /api/trail/my-income?month=2026-04 — My trail income this month
PUT    /api/trail/update-aum             — Batch update AUM from MF data feed
GET    /api/clv/my-clients               — My CLV-tracked clients
GET    /api/clv/my-tier                  — My CLV tier and bonus eligibility
```

### 3.6 POSP Channel Endpoints

```
GET    /api/posp/my-posps                — My managed POSPs (CDM/RM)
POST   /api/posp/recruit                 — Log new POSP recruitment
PUT    /api/posp/activate/:id            — Mark POSP as activated
GET    /api/posp/recruitment-bonus       — My recruitment bonus calculation
GET    /api/posp/activation-bonus        — My activation bonus calculation
```

### 3.7 Dashboard Endpoints

```
GET    /api/dashboard/employee           — RM's personal dashboard data
GET    /api/dashboard/manager            — Manager's team dashboard
GET    /api/dashboard/regional           — VP/Regional rollup
GET    /api/dashboard/company            — Super Admin company view
GET    /api/dashboard/leaderboard        — Anonymized ranking (rank only, no names for peers)
```

### 3.8 Admin Endpoints

```
GET    /api/admin/controls               — Get all admin settings
PUT    /api/admin/controls/:key          — Update setting (Super Admin + audit)
POST   /api/admin/slabs/update           — Update incentive slab tables
GET    /api/admin/audit-log              — View audit trail
POST   /api/admin/month/open             — Open new month for entries
POST   /api/admin/month/close            — Close and lock month
GET    /api/admin/cost-analysis          — Company-wide CTI and cost analysis
```

---

## PART 4: FRONTEND — ROLE-BASED DASHBOARDS

### 4.1 RM/Employee Dashboard (What they see)

```
┌─────────────────────────────────────────────────────────┐
│ TRUSTNER MIS — Welcome, [Name] | [Designation] | [Month]│
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ My Target│ Business │Achievement│ Expected │  Slab       │
│ ₹2,40,000│ ₹2,78,400│  116%    │ ₹16,704  │ Enhanced 6% │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                                                         │
│ [=============================>     ] 116% — ₹12,600 to │
│  Achievement Meter          next slab (131% = Super 7%) │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ PRODUCT-WISE BREAKDOWN THIS MONTH                       │
│ Product          | Raw Amt  | Credit%| Weighted | Status│
│ Health Annual    | ₹85,000  | 100%   | ₹85,000  | ✓     │
│ Life Regular 10yr| ₹1,20,000| 125%   | ₹1,50,000| ✓     │
│ MF SIP Monthly   | ₹15,000  | 100%   | ₹15,000  | ✓     │
│ MF SIP Clawback  |          |        | −₹5,000  | ⚠ Debit│
│ GI Motor Pvt Car | ₹45,000  | grid   | ₹33,400  | ✓     │
│                  | TOTAL    |        | ₹2,78,400|       │
├─────────────────────────────────────────────────────────┤
│ TRAIL INCOME                                            │
│ Incremental AUM: ₹12,50,000 | Trail Rate: 25%          │
│ Monthly Trail: ₹2,604                                   │
├─────────────────────────────────────────────────────────┤
│ SIP HEALTH                                              │
│ Active SIPs: 23 | Stopped this month: 1 (₹5,000)       │
│ Clawback debit applied: ₹5,000                         │
├─────────────────────────────────────────────────────────┤
│ MY CLV: Silver Tier (₹8.2L) | Annual Bonus: ₹15,000    │
│ Next tier (Gold) at ₹15L — ₹6.8L away                  │
├─────────────────────────────────────────────────────────┤
│ CAREER PROGRESS                                         │
│ Current: RM → Next: Sr. RM (need 4/6 months at 100%+)  │
│ Progress: 3/4 qualifying months ✓                       │
├─────────────────────────────────────────────────────────┤
│ ESOP: 500 units granted | 125 vested | Value: ₹62,500   │
└─────────────────────────────────────────────────────────┘

WHAT THEY DO NOT SEE:
  ✗ Company commission rates or margin %
  ✗ Any other employee's data
  ✗ Channel payout percentages
  ✗ Insurer grid details
  ✗ The formula behind target adjustment
  ✗ Other people's salary or incentive
  ✗ Company P&L or vertical profitability
```

### 4.2 Manager Dashboard (Additional views)

```
Everything in RM Dashboard for self PLUS:
  - Team aggregate: Total team business, team achievement %, team incentive pool
  - Individual team member rows: Name, Achievement %, Ranking, Performance Status
    (but NOT their salary or exact incentive amount)
  - Profit Center P&L: Revenue - Costs = Profit → Bonus %
  - Attrition tracker: Team exits, cost attribution
  - POSP recruitment/activation summary (for CDMs)
```

### 4.3 Super Admin Dashboard (Full view)

```
Everything PLUS:
  - Company-wide P&L by vertical
  - All employee details with salary
  - Slab configuration editor
  - Target override capability (with audit trail)
  - Insurer grid management
  - ESOP pool administration
  - Deferred bonus/clawback management
  - Bulk MIS upload (insurer commission statements)
  - Audit log viewer
  - Month open/close controls
```

---

## PART 5: TECHNOLOGY STACK (Recommended)

```
Frontend:
  - React.js / Next.js (TypeScript)
  - Tailwind CSS for styling
  - Recharts / Chart.js for visualizations
  - React Query for API state management

Backend:
  - Node.js with Express OR Python with FastAPI
  - PostgreSQL database (with pgcrypto for encryption)
  - Redis for caching (dashboard data, slab tables)
  - JWT authentication with refresh tokens
  - Role-based middleware for every endpoint

Infrastructure:
  - Docker containerized
  - Deploy on AWS (ECS/EC2) or Vercel + Supabase
  - CloudFront/CDN for static assets
  - Automated backups (daily)
  - SSL/TLS encryption

Data Feeds:
  - CSV/Excel upload for insurer MIS
  - API integration with MF data providers (e.g., CAMS/Karvy/BSE Star)
  - Scheduled nightly calculation job

Audit & Compliance:
  - Every data change logged in audit_log table
  - IP address tracking
  - Export-ready audit reports for IRDAI/SEBI inspection
  - Data retention: 8 years minimum
```

---

## PART 6: CTO RECOMMENDATIONS & IMPROVEMENTS

### 6.1 Additional Features Beyond Current Framework

```
1. GAMIFICATION LAYER
   - Daily/weekly streaks for consistent business logging
   - Badges: "First ₹1L day", "5 SIPs in a week", "Zero clawback month"
   - Leaderboard with anonymized ranks (no names, just "You are #3 of 45")
   - Monthly "Star Performer" auto-notification

2. PREDICTIVE ANALYTICS
   - "At current pace, you'll end the month at X%" projection
   - "To reach Super slab (131%), you need ₹Y more business in Z days"
   - Churn prediction: Flag SIPs likely to stop based on historical patterns
   - Optimal product mix suggestion: "Shift 20% effort to Health for better credit"

3. MOBILE-FIRST DESIGN
   - Progressive Web App (PWA) — works offline, installable
   - Push notifications: "SIP clawback alert", "You crossed 100% today!", "Month closing in 3 days"
   - Quick business entry from mobile (snap policy doc → OCR → auto-fill)

4. AUTOMATED MIS INGESTION
   - Parse insurer commission statements (PDF/Excel) automatically
   - Match policies to RMs via policy number / client PAN
   - Reconciliation dashboard: "45 policies matched, 3 unmatched — review required"

5. CLIENT RELATIONSHIP SCORING
   - Beyond CLV: Score each client on engagement, renewal probability, cross-sell potential
   - Auto-suggest: "Client X has ₹10L in savings — suggest MF SIP"
   - Birthday/anniversary reminders with product suggestions

6. COMPLIANCE DASHBOARD
   - Real-time compliance score per employee
   - Auto-flag: Policy sold without KYC, mis-match in premium vs. proposal
   - Regulatory submission tracker (IRDAI/SEBI filings)

7. TEAM HEALTH METRICS
   - Manager dashboard: Team morale score (derived from performance trends)
   - Early warning: "3 team members below 50% this month — intervention needed"
   - Hiring pipeline tracker with ROI projection

8. MULTI-CURRENCY / MULTI-ENTITY CONSOLIDATION
   - Separate P&L for TIB and TAS
   - Consolidated Trustner Group view
   - Inter-entity referral tracking (TIB RM refers client to TAS for MF)

9. AUTOMATED PAYROLL INTEGRATION
   - Monthly incentive → auto-generate payroll input file
   - TDS calculation on incentive
   - ESOP exercise → tax computation helper

10. DOCUMENT MANAGEMENT
    - Policy document storage per client
    - Auto-attach commission certificate
    - Digital signature for FP Route Maker-Checker
```

### 6.2 Organizational Structure for MIS

```
RECOMMENDED MIS TEAM STRUCTURE:

Phase 1 (Build — Month 1-4):
  - 1 Full-stack Developer (React + Node/Python)
  - 1 Backend Developer (DB + API + calculation engine)
  - 1 UI/UX Designer (part-time)
  - Ram Shah as Product Owner
  - Weekly sprint reviews

Phase 2 (Operate — Month 4+):
  - 1 MIS Coordinator (full-time, internal hire)
    → Responsible for: monthly data ingestion, reconciliation, report generation
  - 1 Developer (part-time maintenance)
  - Support from existing IT/Digital team

MIS COORDINATOR ROLE:
  - Daily: Upload insurer MIS data, verify auto-matching
  - Weekly: Reconcile unmatched policies, SIP status updates
  - Monthly: Trigger incentive calculation, generate payout reports, submit to accounts
  - Quarterly: Update balanced scorecard, ESOP vesting, trail AUM refresh
  - Annually: CLV bonus computation, deferred bonus release/clawback processing
```

### 6.3 Security Architecture (Zero Leakage)

```
DATA ISOLATION MODEL:

Row-Level Security (RLS):
  - PostgreSQL RLS policies enforce that queries ONLY return rows the user is authorized to see
  - Even if someone finds a direct SQL injection, RLS prevents cross-user data access

API-Level Guards:
  - Every endpoint receives user_id from JWT token
  - Middleware checks: "Does user X have permission to see resource Y?"
  - Manager endpoints: Filter by reporting_manager_id chain

Frontend Guards:
  - No sensitive data in browser local storage
  - API responses are pre-filtered — frontend NEVER receives data it shouldn't display
  - No client-side filtering of sensitive data (all filtering server-side)

Encryption:
  - Salary, incentive amounts: Encrypted at rest (pgcrypto)
  - API transport: TLS 1.3
  - Session tokens: HttpOnly, Secure, SameSite cookies

Audit:
  - Every login logged with IP, device, timestamp
  - Every data view logged (who viewed whose data)
  - Every override/edit logged with before/after values
  - Quarterly audit report auto-generated for Board

SPECIAL PROTECTION:
  - Commission rates, insurer grids, margin percentages → visible ONLY to Super Admin
  - Target adjustment formula internals → hidden from employees (they see the TARGET, not the formula)
  - Vertical profitability → visible only to L2+ managers for their own vertical
```

---

## PART 7: IMPLEMENTATION PHASES

```
PHASE 1 (Month 1-2): CORE ENGINE
  ✓ Database setup with all tables
  ✓ Employee master import (from existing Excel)
  ✓ Product master with tier classification
  ✓ Incentive slab tables (DST + POSP RM)
  ✓ Monthly business entry (manual + CSV upload)
  ✓ Weighted business calculation engine
  ✓ Incentive calculation with dual slab lookup
  ✓ Basic RM dashboard

PHASE 2 (Month 2-3): CHANNEL & TRAIL
  ✓ POSP/Channel master
  ✓ Margin-based credit calculation
  ✓ Target adjustment engine
  ✓ Trail income calculator (incremental AUM)
  ✓ SIP tracker with clawback
  ✓ POSP recruitment/activation bonus
  ✓ Manager dashboard

PHASE 3 (Month 3-4): GOVERNANCE
  ✓ FP Route Maker-Checker workflow
  ✓ Balanced Scorecard module
  ✓ Deferred bonus ledger
  ✓ CLV tracking and bonus
  ✓ ESOP grant and vesting tracker
  ✓ Profit Center P&L
  ✓ Audit trail and compliance reports
  ✓ Super Admin dashboard

PHASE 4 (Month 4-6): POLISH & SCALE
  ✓ Mobile PWA
  ✓ Automated MIS ingestion (insurer statements)
  ✓ Predictive analytics
  ✓ Gamification badges
  ✓ Payroll integration
  ✓ Career roadmap tracker
  ✓ Load testing for 500+ users
```

---

## PART 8: REFERENCE FILES

The following files contain the operational data and are available for import:

```
1. Trustner_Incentive_Master_v2.xlsx (Master Workbook)
   - 19 sheets with 1,303 formulas
   - Contains: Employee Master (62 rows), Product Credit Rules (71 rows),
     Monthly Incentive Calc (36 columns), Trail Income Model, Channel Margin Calc,
     POSP RM-CDM Incentive, Profit Center P&L, ESOP & Phantom Stock,
     Balanced Scorecard, Deferred Bonus, CLV Bonus, Product Tier Matrix,
     GI Margin Reference, and more

2. Trustner_Incentive_Framework_Board_Deck_v2.pptx (Board Presentation)
   - 25 slides with speaker's notes
   - Visual reference for all framework components

3. Source data files:
   - Job Responsibilities of Employees Master.xlsx (59 employees)
   - Salary Sheet Feb'26.xlsx (77 employees, payroll data)
   - March Target.xlsx (current target structure)
   - MARCH GRID update 2026 GRID OVERALL.xlsx (14 insurer commission grids)
   - Goalsheet FY 21-22.xlsx (TATA AIA reference for Sitara slabs)
```

---

## PART 9: CRITICAL RULES SUMMARY (DO NOT MISS)

```
1. MF SIP = 100% of MONTHLY business ONLY. Never multiply by 12.
2. SIP clawback: If stopped → debit from that month's business.
3. Trail is on INCREMENTAL AUM only. Starting AUM = 0% trail.
4. POSP Normal Grade = 100% credit against RM's target. (NOT 30%)
5. Franchise = 25% credit. (NOT 15%)
6. Recruitment Bonus is MONTHLY. (NOT Quarterly)
7. Self-business for CDM/RM = 300% credit (In their Target).
8. RM Credit for POSP channel = 100% − Channel Payout %.
9. Target adjustment = (30% / Actual Margin%) × Base Target.
10. DST slab rates: 4%, 5%, 6%, 7%, 8% at multipliers 1.0-2.0×.
11. POSP RM slab rates: 1.2%, 1.5%, 1.8%, 2.1%, 2.4% at multipliers 1.0-2.0×.
12. Below 80% achievement = ZERO incentive (both tables).
13. Area Manager target = 23× (20× base + 15% variable proxy).
14. Deferred bonus: 60/40 split, minimum ₹50K threshold.
15. Loss-making vertical = ZERO bonus (non-negotiable).
16. ESOP: 5% equity, ₹500/unit, 4yr+1yr cliff, phantom pre-IPO.
17. Compliance multiplier: 0.8× for violation, 1.1× for clean.
18. Motor TP Only PSU = NOT counted for POSP activation.
19. FP Route 125% = Requires Maker-Checker by Super Admin.
20. Every override, every edit, every calculation → AUDIT LOG.
```

---

## DEPLOYMENT INSTRUCTION TO CLAUDE CODE

Build this as a full-stack web application. Start with the database schema (PostgreSQL), then the calculation engine (test with the Employee Master data from the Excel), then the API layer, then the React frontend with role-based dashboards.

Priority order:
1. Get the incentive calculation engine working EXACTLY per the formulas above
2. Build the RM dashboard so team members can see their business and expected incentives
3. Build the admin panel for data entry, MIS upload, and month management
4. Add trail income, CLV, ESOP tracking
5. Add governance features (audit trail, Maker-Checker, deferred bonus)
6. Mobile PWA + polish

The Excel workbook (Trustner_Incentive_Master_v2.xlsx) serves as the SPECIFICATION and TEST DATA. Every formula in that workbook must be replicated in the web application's calculation engine. Cross-verify results between the Excel and the web app for the first 3 months.

**This is being built from scratch for a company targeting IPO by 2030. It needs to be enterprise-grade from Day 1 — not a prototype that needs rewriting later. Global best practices, SEBI/IRDAI compliance, and zero data leakage between employees.**

---
*Document Version: 2.2 | Prepared: April 2026 | Author: Ram Shah, Director, Trustner Group*
*Framework designed and documented in collaboration with AI (Claude, Anthropic)*
