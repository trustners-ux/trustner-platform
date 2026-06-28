-- 053 — Meeting Prep sub-table column alignment (CRITICAL data-loss fix)
--
-- BUG: the Meeting Prep edit page + PUT route were rebuilt around a richer
-- field model (topic/key_message, title/estimated_amount_inr, anticipated_answer/
-- sensitivity) but migration 006 and types.ts were never updated. So every
-- talking-point / opportunity / Q&A INSERT wrote columns that don't exist and
-- failed — and the route never checked the insert error, so saves returned
-- success:true while silently losing the brief's core content.
--
-- FIX (additive, safe on existing rows): add the columns the live UI/route use.
-- The legacy columns (point/intent/estimated_minutes/supporting_data_ref,
-- category/estimated_ticket_size_inr/rationale, prepared_answer/source) are kept
-- so nothing breaks; they simply go unused by the current UI. `point` was the one
-- legacy NOT NULL the route doesn't populate, so we relax it.
--
-- Apply in Supabase SQL editor. Idempotent (IF NOT EXISTS / DROP NOT NULL).

-- ── Talking points: live model = topic + key_message + supporting_data ──
ALTER TABLE mp_talking_points ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE mp_talking_points ADD COLUMN IF NOT EXISTS key_message TEXT;
ALTER TABLE mp_talking_points ADD COLUMN IF NOT EXISTS supporting_data TEXT;
ALTER TABLE mp_talking_points ALTER COLUMN point DROP NOT NULL;

-- ── Opportunities: live model = title + estimated_amount_inr ──
ALTER TABLE mp_opportunities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE mp_opportunities ADD COLUMN IF NOT EXISTS estimated_amount_inr BIGINT;

-- ── Anticipated Q&A: live model = anticipated_answer + sensitivity ──
ALTER TABLE mp_anticipated_qa ADD COLUMN IF NOT EXISTS anticipated_answer TEXT;
ALTER TABLE mp_anticipated_qa ADD COLUMN IF NOT EXISTS sensitivity VARCHAR(10);
-- route now supplies order_index, but relax NOT NULL as belt-and-suspenders
ALTER TABLE mp_anticipated_qa ALTER COLUMN order_index DROP NOT NULL;
