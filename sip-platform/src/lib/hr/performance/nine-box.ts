/**
 * Performance — 9-Box Grid Mapper.
 *
 * Standard 3×3 grid: performance (x-axis) × potential (y-axis).
 * Each axis bucketed Low (1-2), Medium (3), High (4-5).
 *
 *                        Potential
 *                Low      Medium     High
 *            +--------+--------+--------+
 *      High  | effective | high_pro |  star    |
 *            +--------+--------+--------+
 * Perf  Med  |  rising  |  core   | growth   |
 *            +--------+--------+--------+
 *      Low   | underper |  solid  | enigma   |
 *            +--------+--------+--------+
 *
 * Quadrant semantics (HR-standard nine-box labels):
 *   star          — top-right (high perf + high pot) — invest, promote.
 *   high_pro      — high perf, medium pot — solid producer, ready for stretch.
 *   effective     — high perf, low pot — specialist; keep, reward, no promo.
 *   growth        — medium perf, high pot — develop, mentor, stretch.
 *   core          — medium perf, medium pot — backbone; coach.
 *   rising        — medium perf, low pot — coach, fit-check.
 *   enigma        — low perf, high pot — diagnose blockers, possibly misfit role.
 *   solid         — low perf, medium pot — manage out or re-role.
 *   underperformer— low perf, low pot — PIP / exit.
 */

export type NineBoxQuadrant =
  | 'underperformer'
  | 'effective'
  | 'rising'
  | 'core'
  | 'solid'
  | 'high_pro'
  | 'enigma'
  | 'growth'
  | 'star';

export type RatingScale = 1 | 2 | 3 | 4 | 5;

type Bucket = 'low' | 'med' | 'high';

function bucket(r: number): Bucket {
  if (r <= 2) return 'low';
  if (r === 3) return 'med';
  return 'high';
}

export function mapNineBox(
  performance: number,
  potential: number
): NineBoxQuadrant {
  const p = bucket(performance);
  const t = bucket(potential);

  // Row by performance, column by potential
  if (p === 'high' && t === 'low') return 'effective';
  if (p === 'high' && t === 'med') return 'high_pro';
  if (p === 'high' && t === 'high') return 'star';

  if (p === 'med' && t === 'low') return 'rising';
  if (p === 'med' && t === 'med') return 'core';
  if (p === 'med' && t === 'high') return 'growth';

  if (p === 'low' && t === 'low') return 'underperformer';
  if (p === 'low' && t === 'med') return 'solid';
  /* p low, t high */ return 'enigma';
}

/** Display labels for UI. */
export const NINE_BOX_LABELS: Record<NineBoxQuadrant, string> = {
  star: 'Star',
  high_pro: 'High Professional',
  effective: 'Effective',
  growth: 'Growth Employee',
  core: 'Core Player',
  rising: 'Rising',
  enigma: 'Enigma',
  solid: 'Solid Contributor',
  underperformer: 'Underperformer',
};

/** Recommended action by quadrant. */
export const NINE_BOX_ACTION: Record<NineBoxQuadrant, string> = {
  star: 'Promote; succession-plan; stretch projects.',
  high_pro: 'Reward; lateral stretch; build broader skills.',
  effective: 'Retain; specialist track; differentiated reward.',
  growth: 'Mentor; assign stretch projects; track quarterly.',
  core: 'Coach; recognise; steady development plan.',
  rising: 'Coach; recheck role fit; quarterly review.',
  enigma: 'Diagnose blockers; consider role change.',
  solid: 'Re-role or manage performance.',
  underperformer: 'PIP; if no improvement, separate.',
};
