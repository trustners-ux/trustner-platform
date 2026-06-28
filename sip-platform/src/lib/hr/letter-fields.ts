/**
 * HR Letter form-field schema.
 * Ported from the standalone HR_Letter_Generator.html (FIELDS array).
 *
 * Each section is a logical grouping of fields. Each field has:
 *   key:     the data key (also the column in hr_letter_archive.data_snapshot)
 *   label:   human label shown in form + used as placeholder when empty
 *   type:    'text' | 'num' | 'date' | 'select' | 'ro' (read-only/computed)
 *   options: for type='select'
 */
export type FieldType = 'text' | 'num' | 'date' | 'select' | 'ro';
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  required?: boolean;
}
export interface FieldGroup {
  group: string;
  fields: readonly FieldDef[];
}

export const HR_FORM_GROUPS: readonly FieldGroup[] = [
  {
    group: 'Letter Meta',
    fields: [
      { key: 'entity', label: 'Entity', type: 'select', options: ['TIB', 'TAS'] as const, required: true },
      { key: 'serial', label: 'Letter Serial No.', type: 'text' },
      { key: 'date', label: 'Letter Date', type: 'date', required: true },
    ],
  },
  {
    group: 'Candidate / Employee Identity',
    fields: [
      { key: 'candidate_name', label: 'Candidate / Employee Full Name', type: 'text', required: true },
      { key: 'parent_spouse', label: 'Father / Mother / Spouse Name', type: 'text' },
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] as const },
      { key: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Other'] as const },
    ],
  },
  {
    group: 'Address',
    fields: [
      { key: 'current_address', label: 'Current Address', type: 'text' },
      { key: 'permanent_address', label: 'Permanent Address', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'pin', label: 'PIN', type: 'text' },
    ],
  },
  {
    group: 'KYC',
    fields: [
      { key: 'pan', label: 'PAN', type: 'text' },
      { key: 'aadhaar_last4', label: 'Aadhaar (last 4 digits only)', type: 'text' },
      { key: 'passport_or_dl', label: 'Passport / DL', type: 'text' },
    ],
  },
  {
    group: 'Bank (salary credit)',
    fields: [
      { key: 'bank_branch', label: 'Bank & Branch', type: 'text' },
      { key: 'account_number', label: 'Account Number', type: 'text' },
      { key: 'ifsc', label: 'IFSC', type: 'text' },
    ],
  },
  {
    group: 'Role / Position',
    fields: [
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'grade_band', label: 'Grade / Band', type: 'text' },
      { key: 'reporting_manager', label: 'Reporting Manager', type: 'text' },
      { key: 'reporting_manager_title', label: 'Manager Title', type: 'text' },
      { key: 'location', label: 'Work Location', type: 'text', required: true },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true },
      { key: 'probation_months', label: 'Probation (months)', type: 'num' },
      { key: 'contract_start', label: 'Contract Start (if contractual)', type: 'date' },
      { key: 'contract_end', label: 'Contract End (if contractual)', type: 'date' },
    ],
  },
  {
    group: 'Compensation — Monthly ₹ (annual auto-computed)',
    fields: [
      { key: 'basic_monthly', label: 'Basic (monthly)', type: 'num' },
      { key: 'hra_monthly', label: 'HRA (monthly)', type: 'num' },
      { key: 'special_allowance_monthly', label: 'Special Allowance (monthly)', type: 'num' },
      { key: 'pf_monthly', label: 'Employer PF (monthly)', type: 'num' },
      { key: 'variable_pay_monthly', label: 'Variable Pay (monthly)', type: 'num' },
      { key: 'fixed_pay_monthly', label: 'Fixed Pay (monthly)', type: 'ro' },
      { key: 'total_ctc_monthly', label: 'Total CTC (monthly)', type: 'ro' },
      { key: 'total_ctc_annual', label: 'Total CTC (annual)', type: 'ro' },
    ],
  },
  {
    group: 'Previous Compensation (for Increment / Promotion)',
    fields: [
      { key: 'prev_total_ctc_annual', label: 'Previous CTC (annual ₹)', type: 'num' },
      { key: 'new_total_ctc_annual', label: 'New CTC (annual ₹)', type: 'num' },
      { key: 'increment_percent', label: 'Increment %', type: 'num' },
      { key: 'effective_date', label: 'Effective Date', type: 'date' },
      { key: 'previous_designation', label: 'Previous Designation', type: 'text' },
      { key: 'new_designation', label: 'New Designation (for Promotion)', type: 'text' },
    ],
  },
  {
    group: 'Probation / Confirmation',
    fields: [
      { key: 'probation_start_date', label: 'Probation Start Date', type: 'date' },
      { key: 'probation_end_date', label: 'Probation End / Confirmation Date', type: 'date' },
      { key: 'performance_rating', label: 'Performance Rating', type: 'select',
        options: ['Exceptional', 'Strong', 'Met expectations', 'Below expectations', 'Unsatisfactory'] as const },
    ],
  },
  {
    group: 'Disciplinary / Show-Cause / Warning',
    fields: [
      { key: 'warning_level', label: 'Warning Level', type: 'select',
        options: ['1st Warning', '2nd Warning', 'Final Warning'] as const },
      { key: 'incident_date', label: 'Incident / Event Date', type: 'date' },
      { key: 'violation_description', label: 'Brief Description of Violation / Misconduct', type: 'text' },
      { key: 'response_deadline', label: 'Response Deadline (for Show Cause)', type: 'date' },
      { key: 'evidence_summary', label: 'Evidence Summary (for Show Cause)', type: 'text' },
    ],
  },
  {
    group: 'Separation / Exit',
    fields: [
      { key: 'resignation_date', label: 'Resignation Submitted On', type: 'date' },
      { key: 'last_working_date', label: 'Last Working Date (LWD)', type: 'date' },
      { key: 'notice_period_status', label: 'Notice Period', type: 'select',
        options: ['Served in full', 'Waived by Company', 'Partially served + buy-out', 'Pending'] as const },
      { key: 'termination_ground', label: 'Termination Ground', type: 'select',
        options: ['Misconduct (CEA breach)', 'Discharge simplicitor (without cause)', 'Probation non-confirmation'] as const },
      { key: 'tenure_from', label: 'Tenure From (for Experience Letter)', type: 'date' },
      { key: 'tenure_to', label: 'Tenure To (for Experience Letter)', type: 'date' },
    ],
  },
  {
    group: 'Related-Party Disclosure (POSP cross-check)',
    fields: [
      { key: 'related_party_yn', label: 'Any relative engaged with Trustner as POSP / agent / advisor?', type: 'select',
        options: ['No', 'Yes — disclosed below'] as const },
      { key: 'related_party_details', label: 'Details (name, relation, capacity, code, period)', type: 'text' },
      { key: 'other_intermediary_yn', label: 'Holding any other insurance intermediary code (POSP, agent, specified person)?', type: 'select',
        options: ['No', 'Yes — disclosed below'] as const },
      { key: 'other_intermediary_details', label: 'Other intermediary details', type: 'text' },
    ],
  },
];

export const FIELD_LABELS: Record<string, string> = HR_FORM_GROUPS
  .flatMap((g) => g.fields)
  .reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = f.label;
    return acc;
  }, {});

/**
 * Recompute auto-derived compensation fields from the monthly inputs.
 * Mirrors the recompute() function in the original HR_Letter_Generator.html.
 */
export function recomputeComp(data: Record<string, unknown>): Record<string, unknown> {
  const n = (k: string) => {
    const v = data[k];
    const parsed = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const fixedMonthly =
    n('basic_monthly') + n('hra_monthly') + n('special_allowance_monthly') + n('pf_monthly');
  const totalMonthly = fixedMonthly + n('variable_pay_monthly');
  return {
    ...data,
    fixed_pay_monthly: fixedMonthly,
    fixed_pay_annual: fixedMonthly * 12,
    basic_annual: n('basic_monthly') * 12,
    hra_annual: n('hra_monthly') * 12,
    special_allowance_annual: n('special_allowance_monthly') * 12,
    pf_annual: n('pf_monthly') * 12,
    variable_pay_annual: n('variable_pay_monthly') * 12,
    total_ctc_monthly: totalMonthly,
    total_ctc_annual: totalMonthly * 12,
  };
}

export interface EntityConfig {
  code: 'TAS' | 'TIB';
  name: string;
  fullName: string;
  cin: string;
  regulator: string;
  registration: string;
  /** Fuller licence description for footers / letterheads. */
  licenceDescription: string;
  addressLine: string;
  jurisdiction: string;
  /** Authorised signatory for offer / appointment & other HR letters. */
  signatoryName: string;
  signatoryDesignation: string;
}

export const ENTITY_CONFIG: Record<'TAS' | 'TIB', EntityConfig> = {
  TAS: {
    code: 'TAS',
    name: 'Trustner Asset Services Pvt. Ltd.',
    fullName: 'Trustner Asset Services Private Limited',
    cin: 'U66301AS2023PTC025505',
    regulator: 'AMFI',
    registration: 'ARN-286886',
    licenceDescription: 'AMFI-registered Mutual Fund Distributor (ARN-286886)',
    addressLine:
      'Registered Office: Sethi Trust Building, Unit 2, 4th Floor, GS Road, Bhangagarh, Dispur, Kamrup (Metro), Assam – 781005',
    jurisdiction: 'Guwahati',
    signatoryName: 'Jumma Ara Begum',
    signatoryDesignation: 'Human Resources',
  },
  TIB: {
    code: 'TIB',
    name: 'Trustner Insurance Brokers Pvt. Ltd.',
    fullName: 'Trustner Insurance Brokers Private Limited',
    cin: 'U66000AS2023PTC023831',
    regulator: 'IRDAI',
    registration: 'IRDAI Licence No. 1067',
    licenceDescription: 'IRDAI-licensed Direct Broker (General) — Licence No. 1067',
    addressLine:
      'Registered Office: Sethi Trust Building, Unit 2, 4th Floor, GS Road, Bhangagarh, Dispur, Kamrup (Metro), Assam – 781005',
    jurisdiction: 'Guwahati',
    signatoryName: 'Rinjima Pathak Das',
    signatoryDesignation: 'Manager',
  },
};

/** Format an INR number with Indian grouping (e.g. 12,34,567). */
export function inr(v: unknown): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  if (!Number.isFinite(n) || n === 0) return '—';
  return Math.round(n).toLocaleString('en-IN');
}
