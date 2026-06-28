/**
 * Default exit clearance checklist template.
 *
 * When a new hr_separation row is created, the API seeds hr_separation_checklist
 * rows from this template. POSP-handover items are the only HARD relieving
 * gate: a relieving letter cannot be issued unless every required POSP item
 * is status='done' with proof_blob_url set (Ram-signed-off May 31 2026).
 *
 * Categories are aligned with the migration-023 CHECK constraint.
 */

export type ExitChecklistCategory =
  | 'assets'
  | 'it_access'
  | 'nda'
  | 'kt'
  | 'knowledge_base'
  | 'manager_signoff'
  | 'finance_clearance'
  | 'admin_clearance'
  | 'it_clearance'
  | 'posp_handover'
  | 'client_handover'
  | 'statutory';

export interface ExitChecklistItem {
  category: ExitChecklistCategory;
  item_label: string;
  item_order: number;
  required: boolean;
  hint?: string;
}

export const EXIT_CHECKLIST_TEMPLATE: readonly ExitChecklistItem[] = [
  // ─── 1. ASSETS ─────────────────────────────────────────────────────
  { category: 'assets', item_order: 1, required: true,  item_label: 'Return company laptop (with charger)' },
  { category: 'assets', item_order: 2, required: false, item_label: 'Return mouse / external keyboard / monitor' },
  { category: 'assets', item_order: 3, required: true,  item_label: 'Return Trustner photo ID card' },
  { category: 'assets', item_order: 4, required: false, item_label: 'Return office access key / RFID card' },
  { category: 'assets', item_order: 5, required: false, item_label: 'Return company-issued phone' },
  { category: 'assets', item_order: 6, required: false, item_label: 'Return company SIM card (or transfer to personal CUG)' },

  // ─── 2. IT ACCESS REVOCATION ───────────────────────────────────────
  { category: 'it_access', item_order: 1, required: true, item_label: 'Disable Trustner email account (forward to manager for 30 days)' },
  { category: 'it_access', item_order: 2, required: true, item_label: 'Remove from Slack / internal chat workspace' },
  { category: 'it_access', item_order: 3, required: true, item_label: 'Revoke Supabase project access' },
  { category: 'it_access', item_order: 4, required: true, item_label: 'Revoke Vercel project access' },
  { category: 'it_access', item_order: 5, required: true, item_label: 'Revoke Sentry / monitoring access' },
  { category: 'it_access', item_order: 6, required: true, item_label: 'Revoke GitHub repo access (remove from org)' },
  { category: 'it_access', item_order: 7, required: true, item_label: 'Revoke Gmail / Google Workspace access' },

  // ─── 3. NDA / CONFIDENTIALITY ──────────────────────────────────────
  { category: 'nda', item_order: 1, required: true, item_label: 'NDA reaffirmation signed (post-exit obligations)' },
  { category: 'nda', item_order: 2, required: true, item_label: 'Confidentiality undertaking signed (client data + financial records)' },

  // ─── 4. KNOWLEDGE TRANSFER ─────────────────────────────────────────
  { category: 'kt', item_order: 1, required: true, item_label: 'KT document prepared and reviewed by manager' },
  { category: 'kt', item_order: 2, required: true, item_label: 'Code / repo handover walkthrough completed' },
  { category: 'kt', item_order: 3, required: true, item_label: 'Client / account handover sessions held' },
  { category: 'kt', item_order: 4, required: true, item_label: 'Password vault transferred to successor (1Password / Bitwarden)' },

  // ─── 5. KNOWLEDGE BASE ─────────────────────────────────────────────
  { category: 'knowledge_base', item_order: 1, required: true, item_label: 'All process docs uploaded to internal wiki / Drive' },

  // ─── 6. MANAGER SIGN-OFF ───────────────────────────────────────────
  { category: 'manager_signoff', item_order: 1, required: true, item_label: 'Line manager clearance signed (work-product accepted)' },

  // ─── 7. FINANCE CLEARANCE ──────────────────────────────────────────
  { category: 'finance_clearance', item_order: 1, required: true, item_label: 'Salary advance / loan balance settled' },
  { category: 'finance_clearance', item_order: 2, required: true, item_label: 'Travel advance / imprest cleared' },
  { category: 'finance_clearance', item_order: 3, required: true, item_label: 'Pending expense reimbursements submitted with receipts' },

  // ─── 8. ADMIN CLEARANCE ────────────────────────────────────────────
  { category: 'admin_clearance', item_order: 1, required: true,  item_label: 'Photo ID card returned to Admin' },
  { category: 'admin_clearance', item_order: 2, required: false, item_label: 'Parking pass returned' },

  // ─── 9. IT CLEARANCE ───────────────────────────────────────────────
  { category: 'it_clearance', item_order: 1, required: true, item_label: 'Asset condition report signed by IT' },
  { category: 'it_clearance', item_order: 2, required: true, item_label: 'Data wipe / device reset confirmed by IT' },

  // ─── 10. POSP HANDOVER — HARD RELIEVING GATE ───────────────────────
  // Ram-signed-off: relieving letter is BLOCKED until both items below are
  // status='done' with proof_blob_url set.
  {
    category: 'posp_handover',
    item_order: 1,
    required: true,
    item_label: 'POSP transferred / surrendered on Insurance Co portal',
    hint: 'Required by IRDAI POSP regulations — must show portal screenshot as proof.',
  },
  {
    category: 'posp_handover',
    item_order: 2,
    required: true,
    item_label: 'Proof of POSP transfer uploaded (portal screenshot + email confirmation)',
    hint: 'Upload PDF/PNG to Vercel Blob and link via proof_blob_url.',
  },

  // ─── 11. CLIENT HANDOVER ───────────────────────────────────────────
  { category: 'client_handover', item_order: 1, required: true, item_label: 'Client mapping reassigned in CRM to successor RM' },
  { category: 'client_handover', item_order: 2, required: true, item_label: 'Introduction emails sent to all mapped clients (successor cc-ed)' },

  // ─── 12. STATUTORY ─────────────────────────────────────────────────
  { category: 'statutory', item_order: 1, required: true, item_label: 'PF transfer Form 19 / 10C signed' },
  { category: 'statutory', item_order: 2, required: true, item_label: 'Gratuity nomination confirmed (Form F)' },
  { category: 'statutory', item_order: 3, required: false, item_label: 'ESI exit recorded (if applicable)' },
  { category: 'statutory', item_order: 4, required: true, item_label: 'Professional Tax stop-request filed with state' },
];

/**
 * Returns true if the relieving-letter HARD GATE is satisfied.
 * Pass the list of checklist rows for a separation; we check that every
 * required posp_handover row is status='done' AND has proof_blob_url set.
 */
export function pospHandoverComplete(
  rows: Array<{ category: string; required: boolean; status: string; proof_blob_url?: string | null }>
): boolean {
  const posp = rows.filter(r => r.category === 'posp_handover' && r.required);
  if (posp.length === 0) return false; // template guarantees ≥1; missing = bug
  return posp.every(r => r.status === 'done' && !!r.proof_blob_url);
}
