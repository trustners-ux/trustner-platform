-- ─────────────────────────────────────────────────────────────────────────────
-- 031 — Client Holdings + SIP Mandates (Phase D)
--
-- Powers /portal/holdings (client self-service AUM/returns/SIPs view) and
-- /admin/client-master/[id]/holdings (admin per-client viewer).
--
-- 3 tables:
--   1. client_holdings           — current scheme-level position per client
--                                  (units, NAV, market value, invested, XIRR).
--                                  REPLACED on each import run (UPSERT by
--                                  client_id × scheme_code × folio).
--   2. client_holdings_snapshots — point-in-time AUM history per client for
--                                  trend charts. Append-only.
--   3. client_sip_mandates       — active SIPs (scheme, monthly amount,
--                                  start date, next due, status).
--
-- Naming discipline (locked May 27 2026):
--   - feed_* prefix on any raw third-party source field — NEVER expose the
--     vendor brand (NGEN / Wealth Elite / etc.) in user-facing UI.
--   - All public-facing columns use generic names (scheme_name, units, etc.).
--
-- FKs:
--   - clients(id)            — Phase A client master
--   - pd_fund_master(amfi_code) — existing AMFI fund master (NAVs/scheme names)
--                                 Soft FK (nullable) since some held schemes
--                                 may not be in our pd_fund_master yet.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Status enums ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE sip_mandate_status AS ENUM ('active', 'paused', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sip_mandate_frequency AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly', 'weekly', 'daily');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE holdings_import_source AS ENUM ('csv_upload', 'excel_upload', 'feed_api', 'manual_entry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 1. CLIENT_HOLDINGS — current scheme-level position ───────────────────────
CREATE TABLE IF NOT EXISTS client_holdings (
  id                          BIGSERIAL PRIMARY KEY,

  -- Owner
  client_id                   BIGINT       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Scheme identity (one or both should be present; we resolve to amfi_code where possible)
  amfi_code                   VARCHAR(20)  REFERENCES pd_fund_master(amfi_code),
  scheme_name                 TEXT         NOT NULL,
  isin                        TEXT,
  folio_number                TEXT,

  -- AMC / category (denorm for fast filters; pulled from pd_fund_master where available)
  amc_name                    TEXT,
  category                    TEXT,
  sub_category                TEXT,

  -- Position
  units                       NUMERIC(20, 4) NOT NULL DEFAULT 0,
  avg_purchase_nav            NUMERIC(12, 4),
  current_nav                 NUMERIC(12, 4),
  nav_date                    DATE,

  -- Money
  total_invested              NUMERIC(20, 2) NOT NULL DEFAULT 0,
  current_value               NUMERIC(20, 2) NOT NULL DEFAULT 0,

  -- Returns (computed at import time; refreshed when NAV updates)
  absolute_return_pct         NUMERIC(8, 2),
  xirr_pct                    NUMERIC(8, 2),

  -- Provenance — internal-only feed_* fields (NEVER expose vendor brand)
  feed_source                 holdings_import_source NOT NULL DEFAULT 'csv_upload',
  feed_external_id            TEXT,                 -- vendor's row ID for dedup
  feed_raw                    JSONB,                -- raw row for audit/debug

  -- Audit
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_imported_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- A client can hold the same scheme across multiple folios
  CONSTRAINT uq_client_holdings_client_scheme_folio
    UNIQUE (client_id, scheme_name, folio_number)
);

CREATE INDEX IF NOT EXISTS idx_ch_client       ON client_holdings (client_id);
CREATE INDEX IF NOT EXISTS idx_ch_amfi         ON client_holdings (amfi_code) WHERE amfi_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ch_value_desc   ON client_holdings (client_id, current_value DESC);
CREATE INDEX IF NOT EXISTS idx_ch_last_import  ON client_holdings (last_imported_at DESC);


-- ── 2. CLIENT_HOLDINGS_SNAPSHOTS — point-in-time AUM history ─────────────────
-- Append-only. Captured at each import run so we can chart AUM over time.
CREATE TABLE IF NOT EXISTS client_holdings_snapshots (
  id                          BIGSERIAL PRIMARY KEY,
  client_id                   BIGINT       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  snapshot_date               DATE         NOT NULL,
  total_invested              NUMERIC(20, 2) NOT NULL DEFAULT 0,
  total_current_value         NUMERIC(20, 2) NOT NULL DEFAULT 0,
  scheme_count                INTEGER      NOT NULL DEFAULT 0,
  feed_source                 holdings_import_source NOT NULL DEFAULT 'csv_upload',
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_chs_client_date UNIQUE (client_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_chs_client_date ON client_holdings_snapshots (client_id, snapshot_date DESC);


-- ── 3. CLIENT_SIP_MANDATES — active SIPs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_sip_mandates (
  id                          BIGSERIAL PRIMARY KEY,

  client_id                   BIGINT       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Scheme identity
  amfi_code                   VARCHAR(20)  REFERENCES pd_fund_master(amfi_code),
  scheme_name                 TEXT         NOT NULL,
  folio_number                TEXT,
  amc_name                    TEXT,

  -- SIP terms
  monthly_amount              NUMERIC(20, 2) NOT NULL,
  frequency                   sip_mandate_frequency NOT NULL DEFAULT 'monthly',
  sip_date                    INTEGER,              -- day of month (1-28 typical)
  start_date                  DATE,
  next_due_date               DATE,
  end_date                    DATE,                 -- if perpetual, NULL
  installments_total          INTEGER,              -- e.g. 36 for 3yr SIP; NULL if perpetual
  installments_paid           INTEGER NOT NULL DEFAULT 0,

  -- Status
  status                      sip_mandate_status NOT NULL DEFAULT 'active',
  mandate_id                  TEXT,                 -- bank/RTA mandate reference
  step_up_pct                 NUMERIC(5, 2),        -- annual step-up if any

  -- Provenance — internal-only feed_* (no vendor brand exposure)
  feed_source                 holdings_import_source NOT NULL DEFAULT 'csv_upload',
  feed_external_id            TEXT,
  feed_raw                    JSONB,

  -- Audit
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_imported_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_sip_client_scheme_mandate
    UNIQUE (client_id, scheme_name, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_sip_client       ON client_sip_mandates (client_id);
CREATE INDEX IF NOT EXISTS idx_sip_status       ON client_sip_mandates (client_id, status);
CREATE INDEX IF NOT EXISTS idx_sip_next_due     ON client_sip_mandates (next_due_date) WHERE status = 'active';


-- ── 4. updated_at triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_holdings_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ch_updated_at ON client_holdings;
CREATE TRIGGER trg_ch_updated_at BEFORE UPDATE ON client_holdings
  FOR EACH ROW EXECUTE FUNCTION trg_holdings_updated_at();

DROP TRIGGER IF EXISTS trg_sip_updated_at ON client_sip_mandates;
CREATE TRIGGER trg_sip_updated_at BEFORE UPDATE ON client_sip_mandates
  FOR EACH ROW EXECUTE FUNCTION trg_holdings_updated_at();


-- ── 5. Aggregated views for the portal ────────────────────────────────────────

-- Per-client roll-up: total AUM, invested, returns, scheme count
CREATE OR REPLACE VIEW client_aum_summary AS
SELECT
  c.id                                          AS client_id,
  c.code                                        AS client_code,
  c.display_name,
  COUNT(DISTINCT h.id)                          AS scheme_count,
  COALESCE(SUM(h.current_value), 0)             AS total_aum,
  COALESCE(SUM(h.total_invested), 0)            AS total_invested,
  COALESCE(SUM(h.current_value), 0) - COALESCE(SUM(h.total_invested), 0) AS absolute_gain,
  CASE
    WHEN COALESCE(SUM(h.total_invested), 0) > 0
    THEN ROUND(((COALESCE(SUM(h.current_value), 0) - COALESCE(SUM(h.total_invested), 0))
                / SUM(h.total_invested) * 100)::numeric, 2)
    ELSE NULL
  END                                           AS absolute_return_pct,
  MAX(h.last_imported_at)                       AS last_updated_at
FROM clients c
LEFT JOIN client_holdings h ON h.client_id = c.id
GROUP BY c.id, c.code, c.display_name;


-- Family-level roll-up (uses families + family_members from migration 027)
-- A client is family-consolidated if they have a family_id; if not, family_id = NULL
-- and they show as a single-member family.
CREATE OR REPLACE VIEW family_aum_summary AS
SELECT
  f.id                                          AS family_id,
  f.code                                        AS family_code,
  f.name                                        AS family_name,
  head.display_name                             AS head_display_name,
  COUNT(DISTINCT fm.client_id)                  AS member_count,
  COUNT(DISTINCT h.id)                          AS scheme_count,
  COALESCE(SUM(h.current_value), 0)             AS total_aum,
  COALESCE(SUM(h.total_invested), 0)            AS total_invested,
  COALESCE(SUM(h.current_value), 0) - COALESCE(SUM(h.total_invested), 0) AS absolute_gain,
  CASE
    WHEN COALESCE(SUM(h.total_invested), 0) > 0
    THEN ROUND(((COALESCE(SUM(h.current_value), 0) - COALESCE(SUM(h.total_invested), 0))
                / SUM(h.total_invested) * 100)::numeric, 2)
    ELSE NULL
  END                                           AS absolute_return_pct,
  MAX(h.last_imported_at)                       AS last_updated_at
FROM families f
JOIN clients head ON head.id = f.head_client_id
JOIN family_members fm ON fm.family_id = f.id AND fm.is_active = TRUE
LEFT JOIN client_holdings h ON h.client_id = fm.client_id
GROUP BY f.id, f.code, f.name, head.display_name;


-- ── 6. Comments ───────────────────────────────────────────────────────────────
COMMENT ON TABLE  client_holdings           IS 'Current scheme-level position per client. UPSERTed on each import run; old rows that disappear from import are NOT auto-deleted (admin must explicitly redeem). Phase D — Trustner Tech Project Jun 3 2026.';
COMMENT ON TABLE  client_holdings_snapshots IS 'Append-only point-in-time AUM history for trend charts. Captured at each import run.';
COMMENT ON TABLE  client_sip_mandates       IS 'Active/paused/cancelled SIP mandates. Powered by /portal/holdings active-SIPs widget.';
COMMENT ON VIEW   client_aum_summary        IS 'Per-client AUM roll-up. Used by /portal/holdings hero card.';
COMMENT ON VIEW   family_aum_summary        IS 'Family-level AUM roll-up. Used by /portal/holdings family-consolidated view (Phase A families table).';
COMMENT ON COLUMN client_holdings.feed_raw  IS 'Raw row from the import for audit. NEVER expose to UI — contains vendor identifiers.';
