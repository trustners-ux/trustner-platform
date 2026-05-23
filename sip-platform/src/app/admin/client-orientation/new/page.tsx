/**
 * Client Orientation — New Draft (placeholder)
 *
 * The full intake form ships in the next sprint. This page prevents
 * 404s when the dashboard's "+ New" button is clicked.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { WorkbenchComingSoon } from '@/components/admin/WorkbenchComingSoon';

export default function ClientOrientationNewPage() {
  return (
    <WorkbenchComingSoon
      agentName="Client Orientation"
      backHref="/admin/client-orientation"
      description="Onboards a new client family — risk profile assessment, financial goal capture, time-horizon mapping, KYC summary, and a personalised investment policy statement that becomes the anchor document for all future advisory work."
      plannedFeatures={[
        'Family details: members, ages, dependents, household income',
        '8-question NISM-compliant risk profile questionnaire',
        'Auto-computed risk category (Conservative / Moderate / Aggressive)',
        'Goal capture: retirement, children education, home, emergency fund',
        'Inflation-adjusted corpus targets per goal + required monthly SIP',
        'KYC documents checklist + upload',
        'Generated Investment Policy Statement (IPS) PDF for client signature',
        'Save Draft → Submit for Review → Approve → Client Signature workflow',
      ]}
    />
  );
}
