-- ─────────────────────────────────────────────────────────────────────────────
-- 033 — Portfolio Diagnostic Verdict Engine v2
--
-- Adds the data spine for the v2 engine (proven against Jaideep 13/13 and an
-- opposite-profile accumulator). v2 becomes the brain; the legacy `verdict`
-- enum column on pd_diagnostic_holdings stays populated (via a mapping in the
-- scoring route) so the existing 8 report generators keep working unchanged.
--
-- Two additions:
--   1. pd_diagnostic_runs   → CLIENT RISK PROFILE (the 6-field intake) + the
--      reconciled risk-model OUTPUT (capacity/tolerance, target equity, ceiling).
--   2. pd_diagnostic_holdings → v2 per-fund detail (quality verdict, gate JSON,
--      suitability, fund risk-tier, final v2 action + rationale).
--
-- Idempotent: all ADD COLUMN IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Client risk profile (intake) + reconciled outputs on the run ──────────
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS risk_profile_captured       BOOLEAN DEFAULT false;
-- intake inputs
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_primary_age              INTEGER;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_life_stage               VARCHAR(20);   -- accumulation|pre_retirement|retirement|legacy
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_monthly_income_inr       BIGINT;        -- guaranteed income (not this portfolio)
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_monthly_expense_inr      BIGINT;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_living_depends_on_this   BOOLEAN;       -- the capacity-override switch
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_net_worth_buffer_inr     BIGINT;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_longest_horizon_years    INTEGER;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_stated_priority          VARCHAR(20);   -- capital_first|balanced|growth_first
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_past_drawdown_behaviour  VARCHAR(20);   -- stayed_invested|stopped_sip|panic_sold|added_more|unknown
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rp_questionnaire_score      INTEGER;       -- optional 0-100
-- reconciled risk-model OUTPUT (so we don't recompute for display)
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_capacity_score           INTEGER;       -- 0-100
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_tolerance_score          INTEGER;       -- 0-100
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_required_return_pct      NUMERIC(6,2);
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_binding_constraint       VARCHAR(12);   -- capacity|tolerance|required
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_target_equity_pct        INTEGER;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_age_rule_equity_pct      INTEGER;       -- naive 100-age, for contrast
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_capacity_overrode_age    BOOLEAN;
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_within_equity_ceiling    VARCHAR(14);   -- Low..Very High
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_profile_label            VARCHAR(40);
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_client_posture           VARCHAR(14);   -- preservation|balanced|growth
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS rm_rationale                JSONB;         -- explainable reasoning trail
ALTER TABLE pd_diagnostic_runs ADD COLUMN IF NOT EXISTS engine_version              VARCHAR(10) DEFAULT '2.0.0';

-- ── 2. v2 per-fund detail on holdings ────────────────────────────────────────
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_quality_verdict      VARCHAR(14);   -- STAR|PASS|FLAG|FAIL|INSUFFICIENT
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_quality_gates        JSONB;         -- [{gate,status,detail}]
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_suitability          VARCHAR(12);   -- SUITABLE|PARTIAL|UNSUITABLE
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_fund_risk_tier       VARCHAR(14);   -- Low..Very High
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_forward_aum          VARCHAR(10);   -- AMPLE|WATCH|TIGHT|BREACHED|NA
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_forward_downside     VARCHAR(10);   -- LOW|MODERATE|HIGH|NA
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_action               VARCHAR(24);   -- STAR_KEEP|KEEP|KEEP_MONITOR|HOLD_PARTIAL|SWITCH_BETTER|EXIT_UNSUITABLE|SWITCH_MODE|REDUCE|REDEEM_TINY
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_action_label         VARCHAR(60);
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_rationale            TEXT;
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_rolling_3y_pct       NUMERIC(8,4);  -- true on-demand rolling return (when fetched)
ALTER TABLE pd_diagnostic_holdings ADD COLUMN IF NOT EXISTS v2_fund_option          VARCHAR(8);    -- growth|idcw

COMMENT ON COLUMN pd_diagnostic_runs.rp_living_depends_on_this IS 'Capacity-override switch: if FALSE (living funded elsewhere), the engine permits higher equity than 100-age — the "60-year-old can hold more equity" rule.';
COMMENT ON COLUMN pd_diagnostic_runs.rm_within_equity_ceiling IS 'Max risk-tier of equity funds appropriate for this client — drives the "great fund, wrong seat" exit logic.';
COMMENT ON COLUMN pd_diagnostic_holdings.v2_action IS 'Trustner Verdict Engine v2 final action (quality x forward x suitability). Legacy `verdict` enum is mapped from this for report back-compat.';
