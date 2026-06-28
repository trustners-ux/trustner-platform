-- 053: Add full PD linkage to pd_free_checks
-- Allows the public free portfolio check to run the full PD engine and
-- provide shareable results via a token URL.
-- Idempotent.

ALTER TABLE pd_free_checks
  ADD COLUMN IF NOT EXISTS results_token      UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS diagnostic_run_id  BIGINT REFERENCES pd_diagnostic_runs(id);

CREATE INDEX IF NOT EXISTS idx_pd_free_checks_results_token
  ON pd_free_checks(results_token) WHERE results_token IS NOT NULL;
