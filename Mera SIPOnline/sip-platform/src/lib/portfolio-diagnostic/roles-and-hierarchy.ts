/**
 * Portfolio Diagnostic — Role Definitions & Hierarchy Logic
 *
 * Defines the 5-level role model used by the Trustner Portfolio
 * Diagnostic Workbench, and the logic for routing reviews up the hierarchy.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type {
  Role,
  RoleName,
  RoleLevel,
  Employee,
  ClientFamily,
  DiagnosticRun,
  CertificationName,
} from './types';

// ─────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

/**
 * The 5-level role hierarchy. Each role's permissions are derived
 * from its level + explicit flags.
 *
 * AUM CEILINGS (approval authority):
 *   L3 Mid Reviewer:    up to ₹50 L family AUM
 *   L4 Senior Reviewer: up to ₹5 Cr family AUM
 *   L5 Admin:           unlimited
 */
export const ROLES: Record<RoleName, Role> = {
  trainee: {
    id: 'role-trainee',
    name: 'trainee',
    level: 1,
    canUpload: false,
    canEditDraft: false,
    canReview: false,
    canApprove: false,
    canPublish: false,
    canOverrideHierarchy: false,
    canManageUsers: false,
    approvalAumCeilingInr: 0,
  },
  junior_analyst: {
    id: 'role-junior',
    name: 'junior_analyst',
    level: 2,
    canUpload: true,
    canEditDraft: true,
    canReview: false,
    canApprove: false,
    canPublish: false,
    canOverrideHierarchy: false,
    canManageUsers: false,
    approvalAumCeilingInr: 0,
  },
  mid_reviewer: {
    id: 'role-mid',
    name: 'mid_reviewer',
    level: 3,
    canUpload: true,
    canEditDraft: true,
    canReview: true,
    canApprove: true,
    canPublish: false, // can recommend approval but cannot publish unilaterally
    canOverrideHierarchy: false,
    canManageUsers: false,
    approvalAumCeilingInr: 50_00_000, // ₹50 Lakh
  },
  senior_reviewer: {
    id: 'role-senior',
    name: 'senior_reviewer',
    level: 4,
    canUpload: true,
    canEditDraft: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canOverrideHierarchy: false,
    canManageUsers: false,
    approvalAumCeilingInr: 5_00_00_000, // ₹5 Crore
  },
  admin: {
    id: 'role-admin',
    name: 'admin',
    level: 5,
    canUpload: true,
    canEditDraft: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canOverrideHierarchy: true,
    canManageUsers: true,
    approvalAumCeilingInr: null, // unlimited
  },
};

// ─────────────────────────────────────────────────────────────────
// CERTIFICATION REQUIREMENTS
// ─────────────────────────────────────────────────────────────────

/**
 * Some segments require a certified reviewer regardless of role level.
 * HNI (>₹50L) and UHNI (>₹5 Cr) require CFP / CFA-L3 certification.
 */
export const SEGMENT_CERTIFICATION_REQUIREMENTS: Record<
  string,
  CertificationName[]
> = {
  Mass: ['NISM-V-A'], // any NISM-V-A certified
  Affluent: ['NISM-V-A'],
  HNI: ['CFP', 'CFA-L3', 'NISM-VA-Investment-Adviser'],
  UHNI: ['CFP', 'CFA-L3'],
};

export function hasRequiredCertification(
  employee: Employee,
  segment: ClientFamily['segment']
): boolean {
  const required = SEGMENT_CERTIFICATION_REQUIREMENTS[segment];
  if (!required || required.length === 0) return true;
  return required.some((cert) => employee.certifications.includes(cert));
}

// ─────────────────────────────────────────────────────────────────
// REVIEWER ROUTING
// ─────────────────────────────────────────────────────────────────

/**
 * Given a diagnostic run and the employee who uploaded it, determine
 * the appropriate first reviewer.
 *
 * Rules (evaluated in order):
 *  1. If uploader is L5 (admin), no review needed → can self-publish
 *  2. If family AUM > uploader's approval ceiling → route up
 *  3. If family segment requires certification uploader lacks → route to certified
 *  4. Otherwise: route to uploader's direct manager
 *  5. If routed person is on leave/inactive → route to their manager
 */
export function determineReviewer(input: {
  uploader: Employee;
  diagnostic: DiagnosticRun;
  family: ClientFamily;
  allEmployees: Employee[];
}): Employee | null {
  const { uploader, diagnostic, family, allEmployees } = input;

  // Rule 1: Admin self-publish
  if (uploader.role.level === 5) {
    return uploader;
  }

  // Rule 2 & 3: Determine minimum required role level
  const requiredLevel = determineRequiredApproverLevel({
    aumInr: family.totalAumInr,
    segment: family.segment,
  });

  // Find best candidate
  const candidates = allEmployees.filter(
    (e) =>
      e.active &&
      e.role.level >= requiredLevel &&
      hasRequiredCertification(e, family.segment) &&
      e.id !== uploader.id // can't review own work
  );

  if (candidates.length === 0) return null;

  // Rule 4: Prefer uploader's direct manager if eligible
  const manager = candidates.find((e) => e.id === uploader.managerId);
  if (manager) return manager;

  // Otherwise: lowest-level eligible candidate with smallest pending queue
  candidates.sort((a, b) => {
    if (a.role.level !== b.role.level) return a.role.level - b.role.level;
    return (a.pendingReviewCount ?? 0) - (b.pendingReviewCount ?? 0);
  });

  return candidates[0];
}

/**
 * Given AUM and segment, determine the minimum role level required
 * to approve the diagnostic.
 */
export function determineRequiredApproverLevel(input: {
  aumInr: number;
  segment: ClientFamily['segment'];
}): RoleLevel {
  const { aumInr, segment } = input;

  // UHNI always requires L5 (admin/owner sign-off)
  if (segment === 'UHNI') return 5;

  // HNI or large AUM requires L4
  if (segment === 'HNI' || aumInr > 50_00_000) return 4;

  // Otherwise L3 is sufficient
  return 3;
}

/**
 * Check if a given employee can take a specific workflow action on
 * a diagnostic run.
 */
export function canEmployeeAct(input: {
  employee: Employee;
  action:
    | 'edit'
    | 'submit'
    | 'review'
    | 'approve'
    | 'publish'
    | 'reject'
    | 'escalate'
    | 'override';
  diagnostic: DiagnosticRun;
  family: ClientFamily;
}): { allowed: boolean; reason?: string } {
  const { employee, action, diagnostic, family } = input;

  const isOwner = diagnostic.uploadedById === employee.id;
  const isCurrentReviewer = diagnostic.currentReviewerId === employee.id;
  const isAdmin = employee.role.level === 5;

  switch (action) {
    case 'edit':
      if (diagnostic.status !== 'DRAFT' && diagnostic.status !== 'CHANGES_REQUESTED') {
        return { allowed: false, reason: 'Can only edit when status is DRAFT or CHANGES_REQUESTED' };
      }
      if (!employee.role.canEditDraft) {
        return { allowed: false, reason: 'Role does not permit drafting' };
      }
      if (!isOwner && !isAdmin) {
        return { allowed: false, reason: 'Only the draft owner or admin can edit' };
      }
      return { allowed: true };

    case 'submit':
      if (diagnostic.status !== 'DRAFT' && diagnostic.status !== 'CHANGES_REQUESTED') {
        return { allowed: false, reason: 'Can only submit from DRAFT or CHANGES_REQUESTED' };
      }
      if (!isOwner && !isAdmin) {
        return { allowed: false, reason: 'Only the draft owner can submit' };
      }
      return { allowed: true };

    case 'review':
      if (diagnostic.status !== 'SUBMITTED' && diagnostic.status !== 'IN_REVIEW' && diagnostic.status !== 'ESCALATED') {
        return { allowed: false, reason: 'Diagnostic is not in a reviewable state' };
      }
      if (!employee.role.canReview) {
        return { allowed: false, reason: 'Role does not permit reviewing' };
      }
      if (!isCurrentReviewer && !isAdmin) {
        return { allowed: false, reason: 'Not the assigned reviewer' };
      }
      return { allowed: true };

    case 'approve':
      if (diagnostic.status !== 'IN_REVIEW' && diagnostic.status !== 'ESCALATED') {
        return { allowed: false, reason: 'Diagnostic must be IN_REVIEW or ESCALATED to approve' };
      }
      if (!employee.role.canApprove) {
        return { allowed: false, reason: 'Role does not permit approval' };
      }
      // Check AUM ceiling
      const ceiling = employee.role.approvalAumCeilingInr;
      if (ceiling !== null && family.totalAumInr > ceiling) {
        return {
          allowed: false,
          reason: `Family AUM ₹${(family.totalAumInr / 100000).toFixed(2)} L exceeds your approval ceiling of ₹${(ceiling / 100000).toFixed(2)} L. Please escalate.`,
        };
      }
      // Check certification
      if (!hasRequiredCertification(employee, family.segment)) {
        return {
          allowed: false,
          reason: `Segment ${family.segment} requires certification: ${SEGMENT_CERTIFICATION_REQUIREMENTS[family.segment]?.join(' or ')}`,
        };
      }
      return { allowed: true };

    case 'publish':
      if (diagnostic.status !== 'APPROVED') {
        return { allowed: false, reason: 'Diagnostic must be APPROVED before publishing' };
      }
      if (!employee.role.canPublish) {
        return { allowed: false, reason: 'Role does not permit publishing' };
      }
      return { allowed: true };

    case 'reject':
      if (!['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(diagnostic.status)) {
        return { allowed: false, reason: 'Cannot reject from current status' };
      }
      if (!employee.role.canApprove) {
        return { allowed: false, reason: 'Role does not permit rejection' };
      }
      return { allowed: true };

    case 'escalate':
      if (diagnostic.status !== 'IN_REVIEW') {
        return { allowed: false, reason: 'Can only escalate from IN_REVIEW' };
      }
      if (!isCurrentReviewer && !isAdmin) {
        return { allowed: false, reason: 'Only the current reviewer can escalate' };
      }
      return { allowed: true };

    case 'override':
      if (!employee.role.canOverrideHierarchy) {
        return { allowed: false, reason: 'Only admin can override hierarchy' };
      }
      return { allowed: true };
  }
}
