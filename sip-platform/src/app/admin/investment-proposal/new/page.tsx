/**
 * Investment Proposal — New Draft (placeholder)
 *
 * The full intake form ships in the next sprint. This page prevents
 * 404s when the dashboard's "+ New Proposal" button is clicked.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { WorkbenchComingSoon } from '@/components/admin/WorkbenchComingSoon';

export default function InvestmentProposalNewPage() {
  return (
    <WorkbenchComingSoon
      agentName="Investment Proposal"
      backHref="/admin/investment-proposal"
      description="Drafts a complete investment proposal for a client family — risk-profile-aligned asset allocation, fund recommendations from Trustner's preferred list, expected returns over horizon, expense impact, and a one-page deliverable PDF ready for the client meeting."
      plannedFeatures={[
        'Link to existing family or create a new one',
        'Risk profile picker (Conservative / Moderate / Aggressive)',
        'Investment purpose (one-time lump sum, SIP, top-up, goal-based)',
        'Proposed amount in INR + investment horizon',
        'Auto-suggested asset allocation from ALLOCATION_TEMPLATES per risk profile',
        'Fund recommendation panel pulling from pd_preferred_funds_by_category',
        'Expected return projection vs benchmark over horizon',
        'Client signature capture + PDF generation (Handlebars + Puppeteer)',
        'Save Draft → Submit for Review → Approve → Publish workflow',
      ]}
    />
  );
}
