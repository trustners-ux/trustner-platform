-- ════════════════════════════════════════════════════════════════════════
-- Migration 039 — ADD DIVIDEND-YIELD FUNDS TO pd_fund_master
-- ════════════════════════════════════════════════════════════════════════
-- The 11 SEBI "Dividend Yield" funds were entirely absent from pd_fund_master
-- (the master was seeded from a curated list that excluded the sub-category),
-- so the NGEN research feed — which DOES carry them — could never match them and
-- they were logged as fuzzy_match_failed. The daily NAV cron only UPDATEs NAV
-- for existing amfi_codes (its insert path violates NOT NULL), so it would never
-- bring them in either. This inserts their identity rows (Regular-plan, Growth-
-- option AMFI codes resolved from the official AMFI NAVAll.txt, NAV 05-Jun-2026)
-- with the master's category convention (short label, no "Fund" suffix). After
-- this, re-running the research-stats importer attaches AUM/TER/SD/Sharpe/returns
-- and the daily cron keeps NAV fresh.
--
-- Convention (verified against existing rows): category = short SEBI label
-- ("Value","Contra","Focused"...) → "Dividend Yield"; sub_category = full label
-- ("Value Fund"...) → "Dividend Yield Fund" (= the feed's external_category).
-- Idempotent via PK(amfi_code) ON CONFLICT.
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO pd_fund_master (amfi_code, scheme_name, amc_name, category, sub_category, current_nav, last_refreshed_at) VALUES
  ('101738', 'Aditya Birla Sun Life Dividend Yield Fund - Growth - Regular Plan',                                'Aditya Birla Sun Life Mutual Fund', 'Dividend Yield', 'Dividend Yield Fund', 445.2800,  NOW()),
  ('103026', 'UTI-Dividend Yield Fund.-Growth',                                                                  'UTI Mutual Fund',                   'Dividend Yield', 'Dividend Yield Fund', 171.1874,  NOW()),
  ('103678', 'Franklin India Dividend Yield Fund-Growth Plan',                                                   'Franklin Templeton Mutual Fund',    'Dividend Yield', 'Dividend Yield Fund', 135.5969,  NOW()),
  ('129310', 'ICICI Prudential Dividend Yield Equity Fund Growth Option',                                        'ICICI Prudential Mutual Fund',      'Dividend Yield', 'Dividend Yield Fund', 51.6100,   NOW()),
  ('148610', 'HDFC Dividend Yield Fund - Growth Plan',                                                           'HDFC Mutual Fund',                  'Dividend Yield', 'Dividend Yield Fund', 24.0630,   NOW()),
  ('148948', 'Tata Dividend Yield Fund-Regular Plan-Growth',                                                     'Tata Mutual Fund',                  'Dividend Yield', 'Dividend Yield Fund', 18.9505,   NOW()),
  ('149697', 'Sundaram Dividend Yield Fund (Formerly Known as Principal Dividend Yield Fund)-Growth Plan',       'Sundaram Mutual Fund',              'Dividend Yield', 'Dividend Yield Fund', 129.2675,  NOW()),
  ('151476', 'SBI Dividend Yield Fund - Regular Plan - Growth',                                                  'SBI Mutual Fund',                   'Dividend Yield', 'Dividend Yield Fund', 14.9031,   NOW()),
  ('152019', 'LIC MF Dividend Yield Fund-Regular Plan-Growth',                                                   'LIC Mutual Fund',                   'Dividend Yield', 'Dividend Yield Fund', 30.8796,   NOW()),
  ('152807', 'Baroda BNP Paribas Dividend Yield Fund - Regular Plan - Growth Option',                            'Baroda BNP Paribas Mutual Fund',    'Dividend Yield', 'Dividend Yield Fund', 9.2714,    NOW()),
  ('154099', 'Kotak Dividend Yield Fund - Regular -Growth',                                                      'Kotak Mahindra Mutual Fund',        'Dividend Yield', 'Dividend Yield Fund', 9.3300,    NOW())
ON CONFLICT (amfi_code) DO UPDATE SET
  scheme_name  = EXCLUDED.scheme_name,
  amc_name     = EXCLUDED.amc_name,
  category     = EXCLUDED.category,
  sub_category = EXCLUDED.sub_category,
  current_nav  = EXCLUDED.current_nav,
  last_refreshed_at = NOW();
