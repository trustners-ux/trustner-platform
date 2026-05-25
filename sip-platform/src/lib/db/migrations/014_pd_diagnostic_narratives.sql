-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 014: Portfolio Diagnostic — LLM-generated Narratives
--
-- Stores the structured JSON output of the LLM narrative engine (the
-- 14-section advisor narrative + per-holding "why" reasoning + meeting
-- note + anticipated Q&A). One row per (diagnostic_run × model_version).
--
-- Why this exists: the platform's report renderers (full-portfolio-
-- review, action-sheet, etc.) used to produce tables-only output —
-- missing the nuance of the hand-crafted reports (Bihani / Dutta /
-- Dhar / Sarkar). This table holds the LLM-enriched narrative that
-- bridges that gap, so the renderers can inject context-aware
-- reasoning per holding + render the full narrative review PDF.
--
-- Lifecycle:
--   1. Advisor uploads diagnostic → status DRAFT
--   2. Scoring engine assigns verdicts (deterministic, fast)
--   3. Narrative engine calls Claude with the structured data → INSERT
--      a row here (status: 'GENERATED')
--   4. Reviewer opens the draft → sees both the data AND the narrative
--   5. Reviewer can edit any section — edits land in `edited_*` fields
--   6. Publish renders the PDFs with the (possibly edited) narrative
--
-- @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pd_diagnostic_narratives (
  id                          BIGSERIAL PRIMARY KEY,
  diagnostic_run_id           BIGINT NOT NULL REFERENCES pd_diagnostic_runs(id) ON DELETE CASCADE,

  -- LLM call metadata
  model_version               TEXT NOT NULL DEFAULT 'claude-opus-4-7',
  prompt_version              TEXT NOT NULL DEFAULT 'v1',
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generation_ms               INTEGER,
  input_tokens                INTEGER,
  output_tokens               INTEGER,
  cache_read_tokens           INTEGER DEFAULT 0,
  cache_creation_tokens       INTEGER DEFAULT 0,

  -- The structured narrative payload — see NarrativeJSON type in
  -- src/lib/portfolio-diagnostic/narrative-engine.ts
  narrative_json              JSONB NOT NULL,

  -- Reviewer override tracking — if a section is edited, the edit
  -- lives here and overrides the LLM output at render time.
  edited_json                 JSONB,
  edited_by_employee_id       BIGINT REFERENCES employees(id),
  edited_at                   TIMESTAMPTZ,

  -- Quality signals — populated by reviewer feedback in Phase 2
  reviewer_rating             SMALLINT CHECK (reviewer_rating BETWEEN 1 AND 5),
  reviewer_notes              TEXT,

  -- Cost ledger for the /admin/health endpoint
  estimated_cost_usd          NUMERIC(8,4),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_narratives_run       ON pd_diagnostic_narratives(diagnostic_run_id);
CREATE INDEX IF NOT EXISTS idx_pd_narratives_generated ON pd_diagnostic_narratives(generated_at DESC);

-- Only one ACTIVE narrative per diagnostic. Regeneration replaces.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pd_narratives_run
  ON pd_diagnostic_narratives(diagnostic_run_id);

COMMENT ON TABLE  pd_diagnostic_narratives                  IS 'LLM-generated narrative content for a diagnostic run. One row per run; regeneration overwrites. The renderer uses edited_json if present, else narrative_json.';
COMMENT ON COLUMN pd_diagnostic_narratives.narrative_json   IS 'Schema: see NarrativeJSON in narrative-engine.ts. Contains: centralFinding, bottomLine, panLevelObservation, perHoldingWhy[], deadMoneyFindings?, portfolioOverlap, internationalPlan?, taxImpact, wealthScenarios[], topActions[], whatNotToDo[], directNote, meetingAgenda[], anticipatedQA[], toneNote';
COMMENT ON COLUMN pd_diagnostic_narratives.edited_json      IS 'Reviewer-edited overrides. Same schema as narrative_json. Renderer prefers this if non-null. Audit trail preserved via app_artefact_views.';
COMMENT ON COLUMN pd_diagnostic_narratives.estimated_cost_usd IS 'Per-call cost — input × $5/MTok + output × $25/MTok for Opus 4.7. Net of cache savings.';
