/**
 * Performance Management — barrel exports.
 *
 * Phase 9 of the Trustner HRMS. Pure-business + DB-helper layer for the
 * appraisal cycle. Consumers: /api/admin/hr/performance/* and
 * /api/employee/hr/performance/*.
 */

export * from './auto-feeds';
export * from './compliance-gate';
export * from './nine-box';
export * from './increment-matrix';

// ─── Shared types — mirror DB columns ────────────────────────────────

export type CycleStatus =
  | 'draft'
  | 'goals_open'
  | 'mid_year'
  | 'self_review_open'
  | 'manager_review_open'
  | 'skip_review_open'
  | 'calibration'
  | 'published'
  | 'archived';

export type CycleType = 'annual' | 'mid_year' | 'probation_confirmation';

export type KraCategory =
  | 'business'
  | 'operational'
  | 'behavioural'
  | 'learning'
  | 'compliance';

export type GoalStatus = 'open' | 'locked';
export type ReviewStatus = 'draft' | 'submitted' | 'locked';
export type PipOutcome = 'open' | 'succeeded' | 'extended' | 'failed';

export type AutoSource =
  | 'hr_dsr_business'
  | 'hr_dsr_meetings'
  | 'hr_dsr_leads'
  | 'manual'
  | 'posp_crosscheck_clean'
  | 'attendance_score';

// ─── Row shapes (kept loose; trim to what the surface layer renders) ──

export interface HrCycleRow {
  id: number;
  cycle_code: string;
  fiscal_year: string;
  cycle_type: CycleType;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  enforce_distribution: boolean;
  distribution_curve: Record<string, number> | null;
  goals_due_date: string | null;
  midyear_due_date: string | null;
  self_review_due_date: string | null;
  manager_review_due_date: string | null;
  skip_review_due_date: string | null;
  calibration_due_date: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrGoalRow {
  id: number;
  cycle_id: number;
  employee_id: number;
  kra_category: KraCategory;
  goal_title: string;
  goal_description: string | null;
  weight: number;
  target_metric: string | null;
  target_value: number | null;
  target_unit: string | null;
  actual_value: number | null;
  auto_source: AutoSource | null;
  auto_pulled_at: string | null;
  midyear_actual: number | null;
  midyear_note: string | null;
  self_rating: number | null;
  self_note: string | null;
  manager_rating: number | null;
  manager_note: string | null;
  final_rating: number | null;
  status: GoalStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrSelfReviewRow {
  id: number;
  cycle_id: number;
  employee_id: number;
  overall_self_rating: number | null;
  narrative_strengths: string | null;
  narrative_improvement: string | null;
  narrative_career: string | null;
  attestation_id: number | null;
  status: ReviewStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrManagerReviewRow {
  id: number;
  cycle_id: number;
  employee_id: number;
  manager_email: string;
  overall_manager_rating: number | null;
  narrative_strengths: string | null;
  narrative_improvement: string | null;
  narrative_potential: string | null;
  potential_rating: number | null;
  narrative_compensation: string | null;
  recommended_increment_pct: number | null;
  recommended_promotion: boolean;
  status: ReviewStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrSkipReviewRow {
  id: number;
  cycle_id: number;
  employee_id: number;
  skip_email: string;
  calibrated_rating: number | null;
  calibration_note: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrRatingRow {
  id: number;
  cycle_id: number;
  employee_id: number;
  final_performance_rating: number;
  final_potential_rating: number | null;
  nine_box_quadrant: import('./nine-box').NineBoxQuadrant | null;
  compliance_capped: boolean;
  compliance_cap_reason: string | null;
  recommended_increment_pct: number | null;
  final_increment_pct: number | null;
  increment_amount: number | null;
  promoted: boolean;
  new_designation: string | null;
  pip_required: boolean;
  locked: boolean;
  locked_at: string | null;
  published_at: string | null;
  letter_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface HrPipMilestone {
  milestone: string;
  target_date: string; // ISO date
  status: 'open' | 'done' | 'missed';
}

export interface HrPipRow {
  id: number;
  rating_id: number;
  cycle_id: number;
  employee_id: number;
  opened_at: string;
  manager_email: string | null;
  expected_outcomes: HrPipMilestone[];
  m30_review_at: string | null;
  m30_note: string | null;
  m60_review_at: string | null;
  m60_note: string | null;
  m90_review_at: string | null;
  m90_note: string | null;
  outcome: PipOutcome;
  separation_id: number | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}
