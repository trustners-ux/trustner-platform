/**
 * Periodic Review — New Draft (placeholder)
 *
 * The full intake form ships in the next sprint. This page prevents
 * 404s when the dashboard's "+ New" button is clicked.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { WorkbenchComingSoon } from '@/components/admin/WorkbenchComingSoon';

export default function PeriodicReviewNewPage() {
  return (
    <WorkbenchComingSoon
      agentName="Periodic Review"
      backHref="/admin/periodic-review"
      description="Runs a scheduled portfolio review for an existing client family — period return vs benchmark, allocation drift check, goal-progress vs plan, action items raised or carried forward, and a client-facing review report ready for the next conversation."
      plannedFeatures={[
        'Pick family + cadence (Quarterly / Semi-Annual / Annual)',
        'Auto-computed review period window from cadence + last review date',
        'Period return (XIRR) vs benchmark over the same window',
        'Asset-allocation drift vs target (rebalancing trigger if > threshold)',
        'Goal-progress check: corpus accumulated vs plan',
        'Open action items from prior reviews (forward / close / new)',
        'Fund-level commentary: holds, swaps proposed, watchlist',
        'Client-facing PDF review report + Save Draft → Submit → Approve workflow',
      ]}
    />
  );
}
