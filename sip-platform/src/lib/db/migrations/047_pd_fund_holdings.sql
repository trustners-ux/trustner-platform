-- 047: Stock-level fund holdings (look-through) — Pillar-6 completion data layer.
-- Fed monthly from AMFI/AMC SEBI-mandated portfolio disclosures (Excel). One row
-- per (scheme, as-of month, stock). Enables family-level stock-overlap aggregation.
-- Idempotent.

CREATE TABLE IF NOT EXISTS pd_fund_holdings (
  id              BIGSERIAL PRIMARY KEY,
  amfi_code       VARCHAR(12)  NOT NULL,        -- resolves to pd_fund_master
  scheme_name     VARCHAR(220) NOT NULL,        -- as printed in the disclosure (for audit)
  as_of_date      DATE         NOT NULL,        -- portfolio month-end
  stock_name      VARCHAR(220) NOT NULL,
  isin            VARCHAR(12),                  -- equity ISIN (INE...) — null for cash/derivative/debt
  instrument_type VARCHAR(20)  DEFAULT 'equity',-- equity | debt | cash | derivative | reit | other
  sector          VARCHAR(120),
  pct_of_aum      NUMERIC(7,4),                 -- % of net assets
  market_value_inr NUMERIC(18,2),
  source          VARCHAR(40),                  -- amfi | amc:<name> | api:<name>
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (amfi_code, as_of_date, stock_name)
);

CREATE INDEX IF NOT EXISTS idx_pd_fund_holdings_code_date ON pd_fund_holdings(amfi_code, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_pd_fund_holdings_isin ON pd_fund_holdings(isin) WHERE isin IS NOT NULL;

-- Convenience view: latest disclosed month per scheme.
CREATE OR REPLACE VIEW pd_fund_holdings_latest AS
SELECT h.*
FROM pd_fund_holdings h
JOIN (
  SELECT amfi_code, MAX(as_of_date) AS max_date
  FROM pd_fund_holdings GROUP BY amfi_code
) m ON m.amfi_code = h.amfi_code AND m.max_date = h.as_of_date;
