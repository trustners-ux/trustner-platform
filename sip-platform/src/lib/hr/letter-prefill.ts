/**
 * Letter auto-fill + Word-export helpers.
 *
 * employeeToLetterData() maps an hr_employees row onto the HR_FORM_GROUPS field
 * keys so a single "pick employee + entity" action fills the whole letter form
 * (and the one-click letter pack) with no re-keying.
 *
 * buildWordDoc() wraps a rendered letter's HTML + CSS into a Word-openable .doc
 * (Office-namespaced HTML). Word/Google Docs honour the class-based letter CSS,
 * so the .doc keeps the on-screen styling and stays fully editable — no DOCX
 * library, no CSS-inlining, no chromium.
 */

/** Row shape we read from hr_employees (loose — Supabase returns `any`). */
export interface EmployeeRowish {
  entity?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  parent_spouse_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;
  pan?: string | null;
  aadhaar_last4?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  account_number_encrypted?: string | null;
  ifsc?: string | null;
  designation?: string | null;
  department?: string | null;
  grade_band?: string | null;
  reporting_manager_name?: string | null;
  location?: string | null;
  office_code?: string | null;
  date_of_joining?: string | null;
  probation_months?: number | null;
  basic_monthly?: number | null;
  hra_monthly?: number | null;
  special_allowance_monthly?: number | null;
  pf_monthly?: number | null;
  variable_pay_monthly?: number | null;
}

/** Today as YYYY-MM-DD (callers may override). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function employeeToLetterData(emp: EmployeeRowish): Record<string, unknown> {
  const fullName = emp.full_name || [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim();
  const bankBranch = [emp.bank_name, emp.bank_branch].filter(Boolean).join(' — ');
  const num = (v: number | null | undefined) => (v == null ? '' : String(v));
  return {
    entity: emp.entity === 'TAS' ? 'TAS' : 'TIB',
    date: today(),
    candidate_name: fullName,
    parent_spouse: emp.parent_spouse_name ?? '',
    dob: emp.dob ?? '',
    gender: emp.gender ?? '',
    marital_status: emp.marital_status ?? '',
    current_address: emp.current_address ?? '',
    permanent_address: emp.permanent_address ?? '',
    city: emp.city ?? '',
    state: emp.state ?? '',
    pin: emp.pin ?? '',
    pan: emp.pan ?? '',
    aadhaar_last4: emp.aadhaar_last4 ?? '',
    bank_branch: bankBranch,
    account_number: emp.account_number_encrypted ?? '',
    ifsc: emp.ifsc ?? '',
    designation: emp.designation ?? '',
    department: emp.department ?? '',
    grade_band: emp.grade_band ?? '',
    reporting_manager: emp.reporting_manager_name ?? '',
    location: emp.location || emp.office_code || '',
    date_of_joining: emp.date_of_joining ?? '',
    probation_months: num(emp.probation_months),
    basic_monthly: num(emp.basic_monthly),
    hra_monthly: num(emp.hra_monthly),
    special_allowance_monthly: num(emp.special_allowance_monthly),
    pf_monthly: num(emp.pf_monthly),
    variable_pay_monthly: num(emp.variable_pay_monthly),
  };
}

/** Wrap a rendered letter (inner HTML + the shared LETTER_CSS) into a Word .doc. */
export function buildWordDoc(innerHtml: string, css: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${title.replace(/[<>&]/g, '')}</title>
<style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: Calibri, Arial, sans-serif; }
${css}
</style>
</head>
<body>${innerHtml}</body>
</html>`;
}

/** Filesystem-safe filename fragment. */
export function safeFileName(s: string): string {
  return String(s || 'letter').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'letter';
}
