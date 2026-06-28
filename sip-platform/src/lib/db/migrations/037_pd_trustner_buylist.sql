-- ════════════════════════════════════════════════════════════════════════
-- Migration 037 — TRUSTNER APPROVED BUY-LIST (pre-shortlisted schemes)
-- ════════════════════════════════════════════════════════════════════════
-- The curated output of Trustner's fund-selection process (Research-Backed
-- Shortlist, May-2026 review). Loaded into the PD so that (a) holdings already
-- on the list are flagged, and (b) SWAP/EXIT replacements are drawn ONLY from
-- APPROVED_OPEN funds within capacity — speeding reviews and keeping them
-- consistent with the firm's house view.
--
-- status:  APPROVED_OPEN      → recommend for fresh money (within add-ceiling)
--          APPROVED_HOLD_ONLY → approved but past add-ceiling → hold, no fresh additions
--          WATCH              → on watch, not presented to fresh SIPs
-- AMFI codes resolved against the research universe; nulls are backfill items.
-- Idempotent via UNIQUE(scheme_name) + ON CONFLICT.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pd_trustner_buylist (
  id                  SERIAL PRIMARY KEY,
  category            TEXT NOT NULL,
  sub_key             TEXT NOT NULL,            -- aligns with subCategoryKey()
  amfi_code           TEXT,                     -- null = needs backfill
  scheme_name         TEXT NOT NULL UNIQUE,
  manager             TEXT,
  manager_tenure_yrs  NUMERIC(4,1),
  aum_inr_cr          NUMERIC(14,2),
  ter                 NUMERIC(5,3),
  cagr_5y             NUMERIC(6,2),
  status              TEXT NOT NULL DEFAULT 'APPROVED_OPEN',
  conviction          TEXT DEFAULT 'CORE',      -- CORE | SATELLITE
  note                TEXT,
  reviewed_on         DATE DEFAULT '2026-05-30',
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_buylist_amfi   ON pd_trustner_buylist(amfi_code);
CREATE INDEX IF NOT EXISTS idx_buylist_subkey ON pd_trustner_buylist(sub_key);

INSERT INTO pd_trustner_buylist
  (category, sub_key, amfi_code, scheme_name, manager, manager_tenure_yrs, aum_inr_cr, ter, cagr_5y, status, conviction, note) VALUES
  ('Flexi Cap',     'flexi',     '100520', 'Franklin India Flexi Cap Fund',        'R. Janakiraman',  10.0,  19049, 1.71, 18.1, 'APPROVED_OPEN',      'CORE',      'Long tenure, comfortable AUM — addable core.'),
  ('Flexi Cap',     'flexi',     '101762', 'HDFC Flexi Cap Fund',                  'Roshi Jain',       3.8, 100479, 1.27, 17.7, 'APPROVED_HOLD_ONLY', 'CORE',      'Strong, but AUM ~Rs1.0L cr is past the add-ceiling - hold existing, no fresh money.'),
  ('Large & Mid',   'large_mid', NULL,     'Kotak Equity Opportunities Fund',      'H. Upadhyaya',    14.0,  30250, 1.58, 18.0, 'APPROVED_OPEN',      'CORE',      'Longest tenure in peer set; very stable. [AMFI backfill]'),
  ('Large & Mid',   'large_mid', '100349', 'ICICI Prudential Large & Mid Cap Fund','Ihab Dalwai',      6.0,  29757, 1.19, 19.0, 'APPROVED_OPEN',      'CORE',      'Best 5Y in peer set; low TER.'),
  ('Mid Cap',       'mid_cap',   NULL,     'Nippon India Growth Fund',             'Rupesh Patel',     3.3,  44000, 1.59, 22.6, 'APPROVED_OPEN',      'CORE',      'Strong all-round; AUM below ceiling. [AMFI backfill]'),
  ('Mid Cap',       'mid_cap',   '140225', 'Edelweiss Mid Cap Fund',               'T. Bhattacharya',  3.0,  15911, 1.55, 21.8, 'APPROVED_OPEN',      'CORE',      'Top returns; most capacity headroom.'),
  ('Small Cap',     'small_cap', '147944', 'Bandhan Small Cap Fund',               'M. Gunwani',       3.0,  25346, 2.00, 23.5, 'APPROVED_OPEN',      'CORE',      'Best returns in set; verify TER/tenure at review.'),
  ('Small Cap',     'small_cap', '125350', 'Axis Small Cap Fund',                  'Sheth / Hyanki',   3.0,  27364, 1.74, 18.1, 'APPROVED_OPEN',      'CORE',      'Clean; large capacity headroom.'),
  ('Small Cap',     'small_cap', '130502', 'HDFC Small Cap Fund',                  'C. Setalvad',     10.0,  38168, 1.64, 17.5, 'APPROVED_OPEN',      'CORE',      'Veteran PM; nearing add-ceiling - monitor at review.'),
  ('Thematic',      'thematic',  '145077', 'ICICI Prudential Manufacturing Fund',  'Roshan Chutkey',   4.0,   5870, 1.86, 22.0, 'APPROVED_OPEN',      'SATELLITE', 'Capex/PLI play (forward sector positioning).'),
  ('Thematic',      'thematic',  '103149', 'ICICI Prudential Infrastructure Fund', 'Ihab Dalwai',      7.0,   8311, 1.80, 25.0, 'APPROVED_OPEN',      'SATELLITE', 'Infra/capex cycle; long record.'),
  ('Thematic',      'thematic',  '101262', 'Nippon India Power & Infra Fund',       'Rahul Modi + team',5.0,   7707, 1.78, 26.8, 'APPROVED_OPEN',      'SATELLITE', 'Energy-transition / power capex.')
ON CONFLICT (scheme_name) DO UPDATE SET
  amfi_code = EXCLUDED.amfi_code, sub_key = EXCLUDED.sub_key, manager = EXCLUDED.manager,
  manager_tenure_yrs = EXCLUDED.manager_tenure_yrs, aum_inr_cr = EXCLUDED.aum_inr_cr, ter = EXCLUDED.ter,
  cagr_5y = EXCLUDED.cagr_5y, status = EXCLUDED.status, conviction = EXCLUDED.conviction,
  note = EXCLUDED.note, active = true;
