-- ════════════════════════════════════════════════════════════════════════
-- Migration 038 — BUY-LIST AMFI BACKFILL (the 2 NULL amfi_code rows from 037)
-- ════════════════════════════════════════════════════════════════════════
-- Migration 037 left two buy-list rows with amfi_code = NULL ("[AMFI backfill]")
-- because the funds were not cleanly findable in the universe by their committee
-- names. Both turned out to be present — their AMCs had RENAMED them to the
-- SEBI-standard category names:
--
--   "Kotak Equity Opportunities Fund"  → "Kotak Large & Midcap Fund"      (103234)
--   "Nippon India Growth Fund"         → "Nippon India Growth Mid Cap Fund" (100377)
--
-- (Regular-plan Growth codes, resolved against AMFI NAVAll + confirmed in
-- pd_fund_master with full research stats as of the 2026-06-03 snapshot.)
--
-- This backfills amfi_code (so exact-match flagging + capacity-aware replacement
-- work), updates scheme_name to the current AMFI name (matches today's CAMS/
-- KFintech statements), refreshes AUM/TER/5Y to the live snapshot for internal
-- consistency, and records the legacy name in the note so RMs still recognise it.
--
-- Idempotent: each UPDATE matches BOTH the legacy and current scheme_name, so it
-- is safe to re-run and works whether the DB currently holds the old or new name.
-- ════════════════════════════════════════════════════════════════════════

UPDATE pd_trustner_buylist SET
  amfi_code   = '103234',
  scheme_name = 'Kotak Large & Midcap Fund',
  sub_key     = 'large_mid',
  aum_inr_cr  = 30251,
  ter         = 1.58,
  cagr_5y     = 13.9,
  note        = 'Longest tenure in peer set; very stable L&M anchor. Formerly "Kotak Equity Opportunities Fund" — AMC renamed to the SEBI Large & Midcap category. Stats: 2026-06-03 snapshot.'
WHERE scheme_name IN ('Kotak Equity Opportunities Fund', 'Kotak Large & Midcap Fund');

UPDATE pd_trustner_buylist SET
  amfi_code   = '100377',
  scheme_name = 'Nippon India Growth Mid Cap Fund',
  sub_key     = 'mid_cap',
  aum_inr_cr  = 45820,
  ter         = 1.54,
  cagr_5y     = 20.3,
  note        = 'Strong all-round mid-cap; AUM below the avoid-ceiling. Formerly "Nippon India Growth Fund" — AMC renamed to the SEBI Mid Cap category. Stats: 2026-06-03 snapshot.'
WHERE scheme_name IN ('Nippon India Growth Fund', 'Nippon India Growth Mid Cap Fund');
