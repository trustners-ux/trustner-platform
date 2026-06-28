/**
 * Default KRA goal templates by role family.
 *
 * Plugged into the "Add goals from template" UX during goals_open state.
 * Each list MUST sum to weight = 100 (asserted in tests + DB trigger).
 *
 * Auto-source values match the CHECK constraint on hr_goals.auto_source.
 */

import type { AutoSource, KraCategory } from '@/lib/hr/performance';

export interface KraTemplateItem {
  kra_category: KraCategory;
  goal_title: string;
  goal_description: string;
  weight: number;
  target_metric: string;
  target_unit: string;
  auto_source?: AutoSource;
}

export interface KraTemplate {
  role_family: 'sales_rm' | 'cdm_service' | 'ops_admin' | 'tech_product';
  label: string;
  items: KraTemplateItem[];
}

// ─── Sales / RM ──────────────────────────────────────────────────────
export const KRA_SALES_RM: KraTemplate = {
  role_family: 'sales_rm',
  label: 'Sales / Relationship Manager',
  items: [
    {
      kra_category: 'business',
      goal_title: 'New Business AUM',
      goal_description:
        'Total business inflows for the fiscal year, auto-sourced from DSR business_inr submissions.',
      weight: 40,
      target_metric: 'AUM_INR',
      target_unit: 'INR',
      auto_source: 'hr_dsr_business',
    },
    {
      kra_category: 'business',
      goal_title: 'New Client SIPs',
      goal_description:
        'Count of newly onboarded SIPs across the cycle (mandate registrations).',
      weight: 20,
      target_metric: 'NEW_SIPS',
      target_unit: 'count',
      auto_source: 'hr_dsr_leads',
    },
    {
      kra_category: 'compliance',
      goal_title: 'POSP Compliance',
      goal_description:
        'Zero open POSP cross-check flags and clean KYC trail for the year.',
      weight: 15,
      target_metric: 'POSP_CLEAN',
      target_unit: 'score',
      auto_source: 'posp_crosscheck_clean',
    },
    {
      kra_category: 'operational',
      goal_title: 'DSR Discipline',
      goal_description:
        'Daily Sales Report submitted on every working day; auto-tracked as attendance presence score.',
      weight: 10,
      target_metric: 'ATTENDANCE_PCT',
      target_unit: '%',
      auto_source: 'attendance_score',
    },
    {
      kra_category: 'learning',
      goal_title: 'Learning & Certification',
      goal_description:
        'Complete mandatory AMFI / NISM refresher and 1 elective course.',
      weight: 15,
      target_metric: 'COURSES_DONE',
      target_unit: 'count',
      auto_source: 'manual',
    },
  ],
};

// ─── CDM / Service ───────────────────────────────────────────────────
export const KRA_CDM_SERVICE: KraTemplate = {
  role_family: 'cdm_service',
  label: 'CDM / Client Service',
  items: [
    {
      kra_category: 'business',
      goal_title: 'Client NPS',
      goal_description:
        'Quarterly Net Promoter Score from client survey (target +50).',
      weight: 35,
      target_metric: 'NPS',
      target_unit: 'score',
      auto_source: 'manual',
    },
    {
      kra_category: 'operational',
      goal_title: 'Service SLA',
      goal_description:
        '% of helpdesk tickets resolved within SLA (target >=95%).',
      weight: 25,
      target_metric: 'SLA_PCT',
      target_unit: '%',
      auto_source: 'manual',
    },
    {
      kra_category: 'compliance',
      goal_title: 'Compliance',
      goal_description:
        'Zero open compliance helpdesk tickets and all client docs current.',
      weight: 15,
      target_metric: 'COMPLIANCE_CLEAN',
      target_unit: 'score',
      auto_source: 'posp_crosscheck_clean',
    },
    {
      kra_category: 'business',
      goal_title: 'Cross-sell Revenue',
      goal_description:
        'Incremental revenue from cross-sold products attributed to this RM.',
      weight: 15,
      target_metric: 'CROSS_SELL_INR',
      target_unit: 'INR',
      auto_source: 'manual',
    },
    {
      kra_category: 'learning',
      goal_title: 'Learning',
      goal_description:
        'Complete service-excellence and grievance-handling refreshers.',
      weight: 10,
      target_metric: 'COURSES_DONE',
      target_unit: 'count',
      auto_source: 'manual',
    },
  ],
};

// ─── Ops / Admin ─────────────────────────────────────────────────────
export const KRA_OPS_ADMIN: KraTemplate = {
  role_family: 'ops_admin',
  label: 'Operations / Admin',
  items: [
    {
      kra_category: 'operational',
      goal_title: 'Process SLA',
      goal_description: 'On-time delivery of core ops processes (target >=98%).',
      weight: 35,
      target_metric: 'PROCESS_SLA',
      target_unit: '%',
      auto_source: 'manual',
    },
    {
      kra_category: 'compliance',
      goal_title: 'Audit-Ready',
      goal_description:
        'Zero audit findings of severity-Medium+ in the fiscal year.',
      weight: 25,
      target_metric: 'AUDIT_FINDINGS',
      target_unit: 'count',
      auto_source: 'manual',
    },
    {
      kra_category: 'operational',
      goal_title: 'Cost Discipline',
      goal_description: 'Stay within budgeted opex envelope (target <=100%).',
      weight: 15,
      target_metric: 'OPEX_PCT_BUDGET',
      target_unit: '%',
      auto_source: 'manual',
    },
    {
      kra_category: 'behavioural',
      goal_title: 'Stakeholder NPS',
      goal_description:
        'Internal stakeholder satisfaction survey (target +60).',
      weight: 15,
      target_metric: 'INT_NPS',
      target_unit: 'score',
      auto_source: 'manual',
    },
    {
      kra_category: 'learning',
      goal_title: 'Learning',
      goal_description:
        'Complete 1 process-improvement course (Lean / Six Sigma equivalent).',
      weight: 10,
      target_metric: 'COURSES_DONE',
      target_unit: 'count',
      auto_source: 'manual',
    },
  ],
};

// ─── Tech / Product ──────────────────────────────────────────────────
export const KRA_TECH_PRODUCT: KraTemplate = {
  role_family: 'tech_product',
  label: 'Tech / Product',
  items: [
    {
      kra_category: 'business',
      goal_title: 'Roadmap Delivery',
      goal_description:
        '% of committed roadmap initiatives shipped to production this cycle.',
      weight: 40,
      target_metric: 'ROADMAP_DELIVERED_PCT',
      target_unit: '%',
      auto_source: 'manual',
    },
    {
      kra_category: 'operational',
      goal_title: 'Quality (Zero P0)',
      goal_description: 'Zero P0 production incidents attributable to the team.',
      weight: 25,
      target_metric: 'P0_INCIDENTS',
      target_unit: 'count',
      auto_source: 'manual',
    },
    {
      kra_category: 'operational',
      goal_title: 'Velocity',
      goal_description:
        'Sprint throughput vs baseline (target >=100% of baseline).',
      weight: 15,
      target_metric: 'VELOCITY_PCT',
      target_unit: '%',
      auto_source: 'manual',
    },
    {
      kra_category: 'business',
      goal_title: 'Customer Impact',
      goal_description:
        'Demonstrated customer-impact metric (NPS lift, conversion, retention) tied to shipped feature.',
      weight: 10,
      target_metric: 'IMPACT_SCORE',
      target_unit: 'score',
      auto_source: 'manual',
    },
    {
      kra_category: 'learning',
      goal_title: 'Learning',
      goal_description:
        'Complete 1 deep-dive technical course or contribute 1 published tech-blog post.',
      weight: 10,
      target_metric: 'LEARNING_DONE',
      target_unit: 'count',
      auto_source: 'manual',
    },
  ],
};

export const KRA_TEMPLATES: KraTemplate[] = [
  KRA_SALES_RM,
  KRA_CDM_SERVICE,
  KRA_OPS_ADMIN,
  KRA_TECH_PRODUCT,
];

/**
 * Sanity helper — verifies every template sums to 100.
 * Throws on mis-sum so it surfaces in build / dev.
 */
export function assertTemplateWeightsSumTo100(): void {
  for (const tpl of KRA_TEMPLATES) {
    const sum = tpl.items.reduce((s, it) => s + it.weight, 0);
    if (sum !== 100) {
      throw new Error(
        `KRA template ${tpl.role_family} weights sum to ${sum}, expected 100`
      );
    }
  }
}
