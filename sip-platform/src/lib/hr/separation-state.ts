/**
 * Separation case state machine (pure functions, no DB).
 *
 * Mirrors the status enum on hr_separation (migration 023):
 *   draft → manager_review → notice_active → clearance_pending
 *         → fnf_pending → fnf_approved → fnf_disbursed → closed
 *
 * Plus two terminal escape hatches:
 *   • withdrawn — employee or HR pulls the case before settlement is approved.
 *     Allowed from any pre-fnf_approved state.
 *   • rejected  — HR refuses the request (e.g. termination paperwork rejected
 *     at intake). Allowed only from draft or manager_review.
 */

export type SeparationStatus =
  | 'draft'
  | 'manager_review'
  | 'notice_active'
  | 'clearance_pending'
  | 'fnf_pending'
  | 'fnf_approved'
  | 'fnf_disbursed'
  | 'closed'
  | 'withdrawn'
  | 'rejected';

/**
 * Adjacency map: from-status → allowed to-statuses.
 * Terminal states (closed, withdrawn, rejected) have no outbound transitions.
 */
export const TRANSITIONS: Record<SeparationStatus, readonly SeparationStatus[]> = {
  draft:              ['manager_review', 'withdrawn', 'rejected'],
  manager_review:     ['notice_active', 'withdrawn', 'rejected'],
  notice_active:      ['clearance_pending', 'withdrawn'],
  clearance_pending:  ['fnf_pending', 'withdrawn'],
  fnf_pending:        ['fnf_approved', 'withdrawn'],
  fnf_approved:       ['fnf_disbursed'],
  fnf_disbursed:      ['closed'],
  closed:             [],
  withdrawn:          [],
  rejected:           [],
};

/** Pure check — can the case move from `from` to `to`? */
export function canTransition(from: SeparationStatus, to: SeparationStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Convenience: terminal status? */
export function isTerminal(s: SeparationStatus): boolean {
  return s === 'closed' || s === 'withdrawn' || s === 'rejected';
}

/** Convenience: post-disbursement status (for closing UI flows)? */
export function isPostFnf(s: SeparationStatus): boolean {
  return s === 'fnf_disbursed' || s === 'closed';
}

/** Human label for status enum (UI). */
export function statusLabel(s: SeparationStatus): string {
  switch (s) {
    case 'draft':              return 'Draft';
    case 'manager_review':     return 'Manager Review';
    case 'notice_active':      return 'Notice Period Active';
    case 'clearance_pending':  return 'Clearance Pending';
    case 'fnf_pending':        return 'F&F Pending';
    case 'fnf_approved':       return 'F&F Approved';
    case 'fnf_disbursed':      return 'F&F Disbursed';
    case 'closed':             return 'Closed';
    case 'withdrawn':          return 'Withdrawn';
    case 'rejected':           return 'Rejected';
  }
}

/**
 * Validate a requested transition and return either { ok: true } or an
 * { ok: false, reason } payload the API layer can return as 422.
 */
export function assertTransition(
  from: SeparationStatus,
  to: SeparationStatus
): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: false, reason: `Already in status '${from}'.` };
  if (!canTransition(from, to)) {
    return {
      ok: false,
      reason: `Illegal transition: '${from}' → '${to}'. Allowed: ${TRANSITIONS[from].join(', ') || '(none)'}.`,
    };
  }
  return { ok: true };
}
