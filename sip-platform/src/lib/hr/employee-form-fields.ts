/**
 * Employee form schema — used by both create and edit pages.
 * Mirrors hr_employees columns from migration 017+019, organized into
 * logical sections for the form UI.
 */
export type FieldType = 'text' | 'num' | 'date' | 'select' | 'email' | 'tel' | 'textarea';
export interface EmpField {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[] | { value: string; label: string }[];
  required?: boolean;
  width?: 'full' | 'half';
  placeholder?: string;
}
export interface EmpSection {
  title: string;
  desc?: string;
  fields: EmpField[];
}

export const EMP_SECTIONS: EmpSection[] = [
  {
    title: 'Identity & Entity',
    fields: [
      { key: 'employee_code',   label: 'Employee Code',  type: 'text', required: true, width: 'half', placeholder: 'TAS-0001 / TIB-0042' },
      { key: 'entity',          label: 'Entity',         type: 'select', required: true, width: 'half',
        options: [{ value: 'TAS', label: 'TAS — Mutual Fund Distribution' }, { value: 'TIB', label: 'TIB — Insurance Broking' }] },
      { key: 'first_name',      label: 'First Name',     type: 'text', required: true, width: 'half' },
      { key: 'last_name',       label: 'Last Name',      type: 'text', required: true, width: 'half' },
      { key: 'parent_spouse_name', label: 'Father / Mother / Spouse Name', type: 'text', width: 'full' },
      { key: 'dob',             label: 'Date of Birth',  type: 'date', width: 'half' },
      { key: 'gender',          label: 'Gender',         type: 'select', width: 'half',
        options: ['Male', 'Female', 'Other'] as const },
      { key: 'marital_status',  label: 'Marital Status', type: 'select', width: 'half',
        options: ['Single', 'Married', 'Other'] as const },
      { key: 'blood_group',     label: 'Blood Group',    type: 'select', width: 'half',
        options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'email',    label: 'Work Email', type: 'email', width: 'half', placeholder: 'name@trustner.in' },
      { key: 'phone',    label: 'Phone',      type: 'tel',   width: 'half', placeholder: '10 digits' },
      { key: 'whatsapp', label: 'WhatsApp',   type: 'tel',   width: 'half', placeholder: '10 digits' },
    ],
  },
  {
    title: 'Address',
    fields: [
      { key: 'current_address',   label: 'Current Address',   type: 'textarea', width: 'full' },
      { key: 'permanent_address', label: 'Permanent Address', type: 'textarea', width: 'full' },
      { key: 'city',  label: 'City',  type: 'text', width: 'half' },
      { key: 'state', label: 'State', type: 'text', width: 'half' },
      { key: 'pin',   label: 'PIN',   type: 'text', width: 'half' },
    ],
  },
  {
    title: 'KYC',
    desc: 'Full PAN stored. Aadhaar — only last 4 digits stored (DPDP best practice).',
    fields: [
      { key: 'pan',             label: 'PAN',                  type: 'text', width: 'half', placeholder: 'AAAAA0000A' },
      { key: 'aadhaar_last4',   label: 'Aadhaar (last 4)',     type: 'text', width: 'half', placeholder: '1234' },
      { key: 'passport_or_dl',  label: 'Passport / DL number', type: 'text', width: 'full' },
    ],
  },
  {
    title: 'Bank (salary credit)',
    fields: [
      { key: 'bank_name',    label: 'Bank Name',    type: 'text', width: 'half', placeholder: 'State Bank of India' },
      { key: 'bank_branch',  label: 'Branch',       type: 'text', width: 'half', placeholder: 'Dispur Main' },
      { key: 'ifsc',         label: 'IFSC',         type: 'text', width: 'half', placeholder: 'SBIN0001234' },
      { key: 'account_type', label: 'Account Type', type: 'select', width: 'half', options: ['Savings', 'Current'] as const },
    ],
  },
  {
    title: 'Role & Office',
    fields: [
      { key: 'designation',            label: 'Designation',        type: 'text', required: true, width: 'half' },
      { key: 'department',             label: 'Department',         type: 'text', width: 'half' },
      { key: 'grade_band',             label: 'Grade / Band',       type: 'text', width: 'half' },
      { key: 'reporting_manager_name', label: 'Reporting Manager',  type: 'text', width: 'half' },
      { key: 'office_code',            label: 'Office',             type: 'select', required: true, width: 'half',
        // options populated at render time from /api/employee/hr/offices
        options: [] },
      { key: 'location',               label: 'Work Location (free text)', type: 'text', width: 'half' },
      { key: 'date_of_joining',        label: 'Date of Joining',    type: 'date', required: true, width: 'half' },
      { key: 'status',                 label: 'Status',             type: 'select', required: true, width: 'half',
        options: [{ value: 'new', label: 'New Hire' },
                  { value: 'active', label: 'Active' },
                  { value: 'on_notice', label: 'On Notice' },
                  { value: 'exited', label: 'Exited' }] },
    ],
  },
  {
    title: 'Compensation (₹ per month — total auto-computed)',
    fields: [
      { key: 'basic_monthly',             label: 'Basic',          type: 'num', width: 'half' },
      { key: 'hra_monthly',               label: 'HRA',            type: 'num', width: 'half' },
      { key: 'special_allowance_monthly', label: 'Special Allowance', type: 'num', width: 'half' },
      { key: 'pf_monthly',                label: 'Employer PF',    type: 'num', width: 'half' },
      { key: 'variable_pay_monthly',      label: 'Variable Pay',   type: 'num', width: 'half' },
    ],
  },
];
