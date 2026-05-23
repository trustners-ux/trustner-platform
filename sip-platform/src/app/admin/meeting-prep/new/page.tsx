/**
 * Meeting Prep — New Draft (placeholder)
 *
 * The full intake form ships in the next sprint. This page prevents
 * 404s when the dashboard's "+ New" button is clicked.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { WorkbenchComingSoon } from '@/components/admin/WorkbenchComingSoon';

export default function MeetingPrepNewPage() {
  return (
    <WorkbenchComingSoon
      agentName="Meeting Prep"
      backHref="/admin/meeting-prep"
      description="Generates a pre-meeting briefing for a scheduled client conversation — relationship history, current holdings snapshot, recent transactions, open action items from the last review, agenda suggestions, and talking-points keyed to the meeting purpose."
      plannedFeatures={[
        'Pick family + meeting date / time / format (in-person, video, phone)',
        'Meeting purpose tag (annual review, goal check-in, market update, new product)',
        'Auto-pulled portfolio snapshot at meeting date',
        'Open action items carried forward from last Periodic Review',
        'Suggested agenda based on meeting purpose',
        'Talking points: market context, fund performance highlights, allocation drift',
        'Print-ready PDF briefing pack for the RM',
        'Save Draft → Submit for Review → Approve workflow',
      ]}
    />
  );
}
