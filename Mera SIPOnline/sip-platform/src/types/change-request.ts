// ─── Change Request Types (Maker-Checker Approval System) ───

export type ChangeRequestType =
  | 'incentive_slab'
  | 'product_rule'
  | 'employee_add'
  | 'employee_edit'
  | 'employee_delete';

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  title: string;
  description: string;
  requestedBy: string; // email
  requestedByName: string;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  // The actual change data (JSON stringified for flexibility)
  changeData: Record<string, unknown>;
  // What the data looked like before (for edits)
  previousData: Record<string, unknown> | null;
}
