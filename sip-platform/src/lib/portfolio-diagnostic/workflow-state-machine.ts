/**
 * Portfolio Diagnostic — Workflow State Machine
 *
 * Defines valid state transitions for a DiagnosticRun and the actions
 * each role can perform. Every transition emits a WorkflowEvent for
 * audit logging.
 *
 * State diagram:
 *
 *   DRAFT ──submit──► SUBMITTED ──assign──► IN_REVIEW
 *     ▲                                       │
 *     │ request_changes                       │ approve
 *     │                                       ▼
 *     │                                  APPROVED ──publish──► PUBLISHED
 *     │                                       │
 *     │                                       │ if AUM > ceiling
 *     │                                       ▼
 *     │                                  ESCALATED
 *     │                                       │
 *     │                                       │ L4 approves
 *     │                                       ▼
 *     │                                  APPROVED
 *     │
 *   CHANGES_REQUESTED ◄──────────── (from IN_REVIEW or ESCALATED)
 *
 *   * Any state → REJECTED (admin override)
 *   * APPROVED → ARCHIVED (admin)
 *   * PUBLISHED → ARCHIVED (admin)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  WorkflowStatus,
  WorkflowAction,
  WorkflowEvent,
  DiagnosticRun,
  Employee,
  ClientFamily,
} from './types';
import { canEmployeeAct, determineRequiredApproverLevel } from './roles-and-hierarchy';

// ─────────────────────────────────────────────────────────────────
// STATE TRANSITION TABLE
// ─────────────────────────────────────────────────────────────────

interface Transition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  action: WorkflowAction;
  /**
   * Optional guard — additional rules beyond role permissions.
   * Returns null if allowed, error string if blocked.
   */
  guard?: (ctx: TransitionContext) => string | null;
}

export interface TransitionContext {
  diagnostic: DiagnosticRun;
  family: ClientFamily;
  actor: Employee;
  metadata?: {
    assigneeId?: string;
    comment?: string;
  };
}

export const TRANSITIONS: ReadonlyArray<Transition> = Object.freeze([
  // DRAFT → SUBMITTED
  {
    from: 'DRAFT',
    to: 'SUBMITTED',
    action: 'SUBMIT',
    guard: (ctx) => {
      if (ctx.diagnostic.holdings.length === 0) {
        return 'Cannot submit without at least one holding';
      }
      if (!ctx.diagnostic.familyId) {
        return 'Cannot submit without a linked client family';
      }
      return null;
    },
  },

  // SUBMITTED → IN_REVIEW (after assignment)
  {
    from: 'SUBMITTED',
    to: 'IN_REVIEW',
    action: 'ASSIGN_REVIEWER',
    guard: (ctx) => {
      if (!ctx.metadata?.assigneeId) {
        return 'Assignee ID required';
      }
      return null;
    },
  },

  // IN_REVIEW → ESCALATED (if AUM exceeds reviewer ceiling)
  {
    from: 'IN_REVIEW',
    to: 'ESCALATED',
    action: 'ESCALATE',
  },

  // ESCALATED → IN_REVIEW (auto-re-route to higher reviewer)
  {
    from: 'ESCALATED',
    to: 'IN_REVIEW',
    action: 'ASSIGN_REVIEWER',
  },

  // IN_REVIEW or ESCALATED → CHANGES_REQUESTED
  {
    from: 'IN_REVIEW',
    to: 'CHANGES_REQUESTED',
    action: 'REQUEST_CHANGES',
    guard: (ctx) => {
      if (!ctx.metadata?.comment) {
        return 'Must provide comment explaining requested changes';
      }
      return null;
    },
  },
  {
    from: 'ESCALATED',
    to: 'CHANGES_REQUESTED',
    action: 'REQUEST_CHANGES',
    guard: (ctx) => {
      if (!ctx.metadata?.comment) {
        return 'Must provide comment explaining requested changes';
      }
      return null;
    },
  },

  // CHANGES_REQUESTED → DRAFT (so uploader can edit)
  {
    from: 'CHANGES_REQUESTED',
    to: 'DRAFT',
    action: 'EDIT_DRAFT',
  },

  // CHANGES_REQUESTED → SUBMITTED (after re-submission)
  {
    from: 'CHANGES_REQUESTED',
    to: 'SUBMITTED',
    action: 'SUBMIT',
  },

  // IN_REVIEW or ESCALATED → APPROVED
  {
    from: 'IN_REVIEW',
    to: 'APPROVED',
    action: 'APPROVE',
    guard: (ctx) => {
      const check = canEmployeeAct({
        employee: ctx.actor,
        action: 'approve',
        diagnostic: ctx.diagnostic,
        family: ctx.family,
      });
      return check.allowed ? null : check.reason ?? 'Approval not permitted';
    },
  },
  {
    from: 'ESCALATED',
    to: 'APPROVED',
    action: 'APPROVE',
    guard: (ctx) => {
      const check = canEmployeeAct({
        employee: ctx.actor,
        action: 'approve',
        diagnostic: ctx.diagnostic,
        family: ctx.family,
      });
      return check.allowed ? null : check.reason ?? 'Approval not permitted';
    },
  },

  // APPROVED → PUBLISHED
  {
    from: 'APPROVED',
    to: 'PUBLISHED',
    action: 'PUBLISH',
    guard: (ctx) => {
      const check = canEmployeeAct({
        employee: ctx.actor,
        action: 'publish',
        diagnostic: ctx.diagnostic,
        family: ctx.family,
      });
      return check.allowed ? null : check.reason ?? 'Publish not permitted';
    },
  },

  // Any reviewable state → REJECTED
  {
    from: 'SUBMITTED',
    to: 'REJECTED',
    action: 'REJECT',
    guard: (ctx) => {
      if (!ctx.metadata?.comment) {
        return 'Rejection requires a reason';
      }
      return null;
    },
  },
  {
    from: 'IN_REVIEW',
    to: 'REJECTED',
    action: 'REJECT',
    guard: (ctx) => {
      if (!ctx.metadata?.comment) {
        return 'Rejection requires a reason';
      }
      return null;
    },
  },
  {
    from: 'ESCALATED',
    to: 'REJECTED',
    action: 'REJECT',
    guard: (ctx) => {
      if (!ctx.metadata?.comment) {
        return 'Rejection requires a reason';
      }
      return null;
    },
  },

  // PUBLISHED or APPROVED → ARCHIVED (admin only)
  {
    from: 'APPROVED',
    to: 'ARCHIVED',
    action: 'ARCHIVE',
  },
  {
    from: 'PUBLISHED',
    to: 'ARCHIVED',
    action: 'ARCHIVE',
  },
  {
    from: 'REJECTED',
    to: 'ARCHIVED',
    action: 'ARCHIVE',
  },
]);

// ─────────────────────────────────────────────────────────────────
// TRANSITION ENGINE
// ─────────────────────────────────────────────────────────────────

export interface TransitionResult {
  success: boolean;
  newStatus?: WorkflowStatus;
  event?: WorkflowEvent;
  error?: string;
}

/**
 * Attempt to transition a diagnostic to a new state. This is the
 * single entry point for ALL state changes in the workflow.
 *
 * Returns success + new state + event to log, OR failure + error.
 */
export function transitionDiagnostic(
  ctx: TransitionContext,
  desiredAction: WorkflowAction
): TransitionResult {
  const currentStatus = ctx.diagnostic.status;

  // 1. Find a matching transition
  const transition = TRANSITIONS.find(
    (t) => t.from === currentStatus && t.action === desiredAction
  );

  if (!transition) {
    return {
      success: false,
      error: `No valid transition from ${currentStatus} via action ${desiredAction}`,
    };
  }

  // 2. Check role permissions via guard
  if (transition.guard) {
    const guardError = transition.guard(ctx);
    if (guardError) {
      return { success: false, error: guardError };
    }
  }

  // 3. Check AUM-based auto-escalation: if assigning a reviewer whose
  //    role cannot approve this AUM, force an ESCALATED state instead
  let finalToStatus = transition.to;
  if (
    transition.action === 'ASSIGN_REVIEWER' &&
    transition.to === 'IN_REVIEW' &&
    ctx.metadata?.assigneeId
  ) {
    // (In a real implementation we'd look up the assignee Employee
    // here. For now we trust the caller to escalate as needed.)
  }

  // 4. Build the event
  const event: WorkflowEvent = {
    id: generateId(),
    diagnosticRunId: ctx.diagnostic.id,
    actorId: ctx.actor.id,
    actorRole: ctx.actor.role.name,
    action: desiredAction,
    fromStatus: currentStatus,
    toStatus: finalToStatus,
    assigneeId: ctx.metadata?.assigneeId,
    comment: ctx.metadata?.comment,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    newStatus: finalToStatus,
    event,
  };
}

/**
 * Return the list of valid actions a given employee can perform on
 * the current state of the diagnostic.
 *
 * Used by the UI to render only the applicable action buttons.
 */
export function getAvailableActions(input: {
  diagnostic: DiagnosticRun;
  family: ClientFamily;
  actor: Employee;
}): WorkflowAction[] {
  const { diagnostic, family, actor } = input;
  const validTransitions = TRANSITIONS.filter(
    (t) => t.from === diagnostic.status
  );

  return validTransitions
    .filter((t) => {
      // Quick permission filter without running guards
      const actionMap: Record<WorkflowAction, keyof Employee['role']> = {
        EDIT_DRAFT: 'canEditDraft',
        SUBMIT: 'canEditDraft',
        ASSIGN_REVIEWER: 'canReview',
        START_REVIEW: 'canReview',
        COMMENT: 'canReview',
        REQUEST_CHANGES: 'canApprove',
        APPROVE: 'canApprove',
        ESCALATE: 'canReview',
        REJECT: 'canApprove',
        PUBLISH: 'canPublish',
        ARCHIVE: 'canOverrideHierarchy',
        OVERRIDE: 'canOverrideHierarchy',
        CREATE_DRAFT: 'canUpload',
      };
      const requiredPermission = actionMap[t.action];
      if (!requiredPermission) return false;
      return Boolean(actor.role[requiredPermission]);
    })
    .map((t) => t.action);
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if a diagnostic is "actionable" (i.e., not in a terminal state).
 */
export function isTerminalStatus(status: WorkflowStatus): boolean {
  return ['ARCHIVED', 'REJECTED'].includes(status);
}

export function isPublishableStatus(status: WorkflowStatus): boolean {
  return status === 'APPROVED';
}

export function isEditableStatus(status: WorkflowStatus): boolean {
  return status === 'DRAFT' || status === 'CHANGES_REQUESTED';
}
