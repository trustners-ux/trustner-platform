/**
 * Comprehensive Financial Blueprint — Coming in Phase 3 (April 14).
 * For now, redirects to Standard with a note about upgrade.
 */
import { redirect } from 'next/navigation';

export default function ComprehensivePlanPage() {
  // Phase 3: Full 8-step + family details wizard will be built here
  redirect('/financial-planning/assess');
}
