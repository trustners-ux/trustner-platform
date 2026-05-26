-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 015: Trustner Preferred Swap Pairs
--
-- Stores the firm's institutional view on "if a client holds fund X
-- and the engine flags it for swap, recommend fund Y instead".
--
-- Why this exists: the scoring engine's auto-picked replacement is
-- whichever fund_master row has the highest composite score in the
-- same category. That's mathematically defensible but misses the
-- Trustner CFP team's specific judgment about which funds they
-- endorse for which exits (e.g., Axis Long Term Equity → Mirae ELSS
-- because Sangeeta has tracked Mirae's manager continuity since
-- 2019, not because Mirae's 3Y CAGR is marginally higher).
--
-- The engine consults this table first; only falls back to
-- composite-score logic when no preferred pair exists.
--
-- Lifecycle:
--   1. CFP committee (Ram + Sangeeta + reviewers) curate pairs
--      through the /admin/funds/preferred-swaps UI
--   2. Each pair is approved by an employee (audit trail)
--   3. Scoring engine reads active=true rows at score time
--   4. Pairs can be deactivated (active=false) without deletion,
--      so the historical decisions remain queryable
--
-- @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pd_preferred_swaps (
  id                          BIGSERIAL PRIMARY KEY,

  -- Exit side (the fund being swapped out of)
  exit_amfi_code              TEXT NOT NULL,
  exit_scheme_name            TEXT NOT NULL,

  -- Recommended side (the fund being swapped into)
  recommended_amfi_code       TEXT NOT NULL,
  recommended_scheme_name     TEXT NOT NULL,

  -- Justification — shown verbatim in the engine-generated rationale
  -- ("Trustner-preferred swap: <rationale>"). One sentence usually.
  rationale                   TEXT NOT NULL,

  -- Audit
  approved_by_employee_id     BIGINT REFERENCES employees(id),
  approved_by_email           TEXT,            -- denormalised for admin users
  approved_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft-delete: false hides the row from the engine but keeps history
  active                      BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at              TIMESTAMPTZ,
  deactivated_by_employee_id  BIGINT REFERENCES employees(id),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One ACTIVE recommendation per exit fund at a time. Partial unique
-- index lets historical (inactive) rows accumulate without conflict.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_preferred_swaps_active_exit
  ON pd_preferred_swaps (exit_amfi_code) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_preferred_swaps_exit ON pd_preferred_swaps (exit_amfi_code);
CREATE INDEX IF NOT EXISTS idx_preferred_swaps_active ON pd_preferred_swaps (active);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION pd_preferred_swaps_set_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pd_preferred_swaps_updated_at ON pd_preferred_swaps;
CREATE TRIGGER pd_preferred_swaps_updated_at
  BEFORE UPDATE ON pd_preferred_swaps
  FOR EACH ROW EXECUTE FUNCTION pd_preferred_swaps_set_updated();

COMMENT ON TABLE pd_preferred_swaps                IS 'Trustner CFP-team curated exit→recommend swap pairs. The scoring engine prefers these over auto-picked composite-score replacements.';
COMMENT ON COLUMN pd_preferred_swaps.exit_amfi_code       IS 'AMFI code of the fund being swapped OUT.';
COMMENT ON COLUMN pd_preferred_swaps.recommended_amfi_code IS 'AMFI code of the Trustner-recommended replacement.';
COMMENT ON COLUMN pd_preferred_swaps.rationale            IS 'One-sentence justification, shown verbatim in the rendered SWAP rationale.';
COMMENT ON COLUMN pd_preferred_swaps.active               IS 'False soft-deletes the row from engine lookups while preserving audit trail.';
