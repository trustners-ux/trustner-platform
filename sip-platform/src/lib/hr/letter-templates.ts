/**
 * HR Letter template registry — Phase 1a + 1b.
 *
 * 20 letter templates covering the full employee lifecycle. Each template
 * renders to a print-friendly HTML string, persists to hr_letter_archive
 * with full data snapshot, and reflects Trustner's fraud-prevention
 * redesign brief (anti-gaming variable-pay, related-party disclosure,
 * dual-coding prohibition for TIB, etc.).
 *
 * Letters categorized by lifecycle stage:
 *   Joining: offer, appointment_tas, appointment_tib, appointment_field_sales_tib,
 *            appointment_onsite, appointment_contractual
 *   Compliance/Onboarding: related_party_disclosure, irdai_acknowledgement,
 *            bgv_authorization, nda, non_compete
 *   Tenure:  probation_confirmation, increment, promotion
 *   Discipline: warning, show_cause
 *   Exit:    resignation_acceptance, termination, relieving, experience
 */

import { ENTITY_CONFIG, FIELD_LABELS, inr } from './letter-fields';
import { SIGNATURE_DATA_URI } from './letter-signatures';

export interface LetterTemplate {
  id: string;
  name: string;
  category: string;
  entityScoped: ('TAS' | 'TIB')[];
  render: (data: Record<string, unknown>) => string;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** Field-or-placeholder helper */
function f(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (v === null || v === undefined || String(v).trim() === '') {
    return `<span class="ph">[${FIELD_LABELS[key] || key}]</span>`;
  }
  return esc(v);
}

function entityOf(data: Record<string, unknown>): 'TAS' | 'TIB' {
  return data.entity === 'TAS' ? 'TAS' : 'TIB';
}

function masthead(entityCode: 'TAS' | 'TIB'): string {
  const ent = ENTITY_CONFIG[entityCode];
  return `
    <div class="lh">
      <div class="info">
        <div class="cn">${esc(ent.name)}</div>
        <div class="meta">CIN: ${esc(ent.cin)} · ${esc(ent.regulator)} ${esc(ent.registration)}</div>
        <div class="meta">${esc(ent.addressLine)}</div>
      </div>
    </div>
  `;
}

function refLine(data: Record<string, unknown>, prefix: string): string {
  const serial = data.serial
    ? esc(`${prefix}${data.serial}`)
    : `<span class="ph">[${prefix}serial]</span>`;
  return `
    <table class="ref"><tbody><tr>
      <td class="l"><b>Ref:</b> ${serial}</td>
      <td class="r"><b>Date:</b> ${f(data, 'date')}</td>
    </tr></tbody></table>
  `;
}

function footer(version = '2.0'): string {
  return `
    <div class="ftr">
      <span>Version ${version} · Effective 30 May 2026 · Board-approved: [date]</span>
      <span>Confidential — Internal Use Only</span>
    </div>
  `;
}

function sigBlock(entityName: string, candidateField: string, data: Record<string, unknown>, candidateLabel = 'Candidate Acceptance'): string {
  const ec = entityOf(data);
  const ent = ENTITY_CONFIG[ec];
  const sig = SIGNATURE_DATA_URI[ec];
  return `
    <table class="sig"><tbody><tr>
      <td class="c">
        <img class="sigimg" src="${sig}" alt="Authorised signatory" />
        <div class="ln">For ${esc(entityName)}</div>
        <div class="st"><b>${esc(ent.signatoryName)}</b>, ${esc(ent.signatoryDesignation)}</div>
        <div class="st">Authorised Signatory</div>
      </td>
      <td class="c">
        <div class="ln gap">${f(data, candidateField)}</div>
        <div class="st">${esc(candidateLabel)} — Date: __________</div>
      </td>
    </tr></tbody></table>
  `;
}

/** Common CSS — kept here so the API route can ship CSS + HTML together. */
export const LETTER_CSS = `
  .letter { font-family: Calibri, Arial, sans-serif; color: #111; font-size: 11pt; line-height: 1.5; max-width: 720px; margin: 0 auto; }
  .letter .lh { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #1B3A5C; padding-bottom: 8px; margin-bottom: 6px; }
  .letter .lh .info { flex: 1; }
  .letter .lh .cn { font-size: 15pt; font-weight: 700; color: #1B3A5C; letter-spacing: .3px; }
  .letter .lh .meta { font-size: 7.5pt; color: #555; margin-top: 2px; }
  .letter .title { text-align: center; font-size: 17pt; font-weight: 700; color: #1B3A5C; margin: 12px 0 2px; }
  .letter .sub { text-align: center; font-size: 9.5pt; font-weight: 700; color: #C5A55A; margin-bottom: 14px; }
  .letter table.ref { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 10px 0; }
  .letter table.ref td { padding: 0; border: none; }
  .letter table.ref td.r { text-align: right; }
  .letter .conf { font-weight: 700; color: #1B3A5C; font-size: 10pt; margin: 6px 0; }
  .letter p { margin: 7px 0; text-align: justify; font-size: 10.5pt; }
  .letter h4 { color: #1B3A5C; font-size: 11pt; margin: 14px 0 5px; border-bottom: 1px solid #C5A55A; padding-bottom: 2px; }
  .letter h5 { color: #1B3A5C; font-size: 10.5pt; margin: 10px 0 4px; }
  .letter ul, .letter ol { margin: 5px 0 8px 22px; }
  .letter li { margin-bottom: 3px; font-size: 10pt; }
  .letter table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
  .letter table.kv td { border: 1px solid #c9d4df; padding: 5px 8px; }
  .letter table.kv td.k { background: #eef3f8; font-weight: 700; color: #1B3A5C; width: 34%; }
  .letter table.ctc th { background: #1B3A5C; color: #fff; padding: 6px 8px; text-align: right; font-size: 9pt; }
  .letter table.ctc th:first-child { text-align: left; }
  .letter table.ctc td { border: 1px solid #c9d4df; padding: 5px 8px; text-align: right; }
  .letter table.ctc td:first-child { text-align: left; }
  .letter table.ctc tr.tot td { background: #fbf6ea; font-weight: 700; }
  .letter .box { border-left: 5px solid #1B3A5C; background: #eef3f8; padding: 10px 14px; margin: 9px 0; border-radius: 0 4px 4px 0; }
  .letter .box.gold { background: #fbf6ea; }
  .letter .box.rose { background: #fef2f2; border-left-color: #b91c1c; }
  .letter .box .bt { font-weight: 700; color: #1B3A5C; font-size: 10pt; margin-bottom: 3px; }
  .letter table.sig { width: 100%; border-collapse: collapse; margin-top: 26px; }
  .letter table.sig td.c { width: 50%; vertical-align: bottom; padding: 0 24px 0 0; border: none; }
  .letter .sig .sigimg { height: 46px; max-width: 200px; object-fit: contain; display: block; margin-bottom: 2px; }
  .letter .sig .ln { border-top: 1px solid #000; padding-top: 3px; font-size: 9.5pt; font-weight: 700; }
  .letter .sig .ln.gap { margin-top: 46px; }
  .letter .sig .st { font-size: 8.5pt; color: #555; }
  .letter .ph { color: #b8902f; font-style: italic; background: #fbf6ea; padding: 0 3px; border-radius: 3px; }
  .letter .ftr { margin-top: 22px; border-top: 1px solid #C5A55A; padding-top: 5px; font-size: 7.5pt; color: #777; display: flex; justify-content: space-between; }
  @media print { body { background: #fff; } .letter { max-width: 100%; } }
`;

// ─── Reusable building blocks ─────────────────────────────────────

function ctcTable(d: Record<string, unknown>): string {
  return `
  <table class="ctc">
    <thead><tr><th>Component</th><th>Monthly (₹)</th><th>Annual (₹)</th></tr></thead>
    <tbody>
      <tr><td>Basic</td><td>${inr(d.basic_monthly)}</td><td>${inr(d.basic_annual)}</td></tr>
      <tr><td>House Rent Allowance</td><td>${inr(d.hra_monthly)}</td><td>${inr(d.hra_annual)}</td></tr>
      <tr><td>Special Allowance</td><td>${inr(d.special_allowance_monthly)}</td><td>${inr(d.special_allowance_annual)}</td></tr>
      <tr><td>Employer's PF Contribution</td><td>${inr(d.pf_monthly)}</td><td>${inr(d.pf_annual)}</td></tr>
      <tr><td><b>Fixed Pay Sub-Total</b></td><td><b>${inr(d.fixed_pay_monthly)}</b></td><td><b>${inr(d.fixed_pay_annual)}</b></td></tr>
      <tr><td>Variable Pay (performance-linked)</td><td>${inr(d.variable_pay_monthly)}</td><td>${inr(d.variable_pay_annual)}</td></tr>
      <tr class="tot"><td><b>Total CTC</b></td><td><b>${inr(d.total_ctc_monthly)}</b></td><td><b>${inr(d.total_ctc_annual)}</b></td></tr>
    </tbody>
  </table>`;
}

const antiGamingBox = `
  <div class="box gold">
    <div class="bt">Variable Pay — Anti-Gaming</div>
    <p>The Variable Pay component is subject to <strong>genuine business achievement</strong>,
    verified through reconciliation against actual customer transactions and not against pipeline
    or MIS submissions alone. The Company reserves the right to withhold, reduce, or recover any
    Variable Pay where it is established that the underlying business is non-genuine, padded,
    fabricated, or otherwise misreported.</p>
  </div>
`;

function regulatoryLine(entityCode: 'TAS' | 'TIB'): string {
  return entityCode === 'TIB'
    ? `As ${esc(ENTITY_CONFIG.TIB.name)} is an IRDAI-licensed Insurance Broker, this offer is further conditional on the Candidate not holding any current insurance intermediary code (POSP, agent, specified person) with any other entity, in line with IRDAI norms against dual coding.`
    : `As ${esc(ENTITY_CONFIG.TAS.name)} is an AMFI-registered Mutual Fund Distributor, this offer is conditional on the Candidate complying with all AMFI Code of Conduct obligations applicable to its employees.`;
}

// ─── 1. Offer Letter ───────────────────────────────────────────────
const offerLetter: LetterTemplate = {
  id: 'offer', name: 'Offer Letter', category: 'Joining', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Offer of Employment</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, `${ec}/OFFER/2026/`)}
  <div class="conf">Strictly Private &amp; Confidential — Addressee Only</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>Following our recent discussions and the successful completion of the interview process,
  ${esc(ent.name)} (the &ldquo;Company&rdquo;) is pleased to offer you the position of
  <strong>${f(d, 'designation')}</strong> in the <strong>${f(d, 'department')}</strong> function,
  based at <strong>${f(d, 'location')}</strong>, reporting to <strong>${f(d, 'reporting_manager')}</strong>
  (${f(d, 'reporting_manager_title')}).</p>
  <h4>1. Joining &amp; Probation</h4>
  <p>Your date of joining shall be <strong>${f(d, 'date_of_joining')}</strong>. You will be on
  probation for a period of <strong>${f(d, 'probation_months')} months</strong> during which the
  notice period shall be one (1) week from either side. On confirmation, the standard notice
  period of two (2) months shall apply.</p>
  <h4>2. Compensation</h4>
  <p>Your total cost-to-company (CTC) shall be <strong>₹ ${inr(d.total_ctc_annual)} per annum</strong>
  (<strong>₹ ${inr(d.total_ctc_monthly)} per month</strong>) structured as below:</p>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>3. Conditions of Offer</h4>
  <p>This offer is conditional on:</p>
  <ol>
    <li>Satisfactory clearance of background verification (employment history, education credentials, regulator databases, litigation searches).</li>
    <li>Execution of the Company's Confidentiality &amp; Employment Agreement.</li>
    <li>Execution of the <strong>Related-Party Disclosure</strong> declaring whether any relative is, or is being proposed as, a Trustner POSP, agent, advisor, or intermediary.</li>
    <li>Execution of the <strong>${esc(ent.regulator)} Compliance Acknowledgement</strong>.</li>
    <li>${regulatoryLine(ec)}</li>
  </ol>
  <h4>4. Jurisdiction</h4>
  <p>This offer and any agreement arising from it shall be governed by Indian law. Courts at
  <strong>${esc(ent.jurisdiction)}</strong> shall have exclusive jurisdiction.</p>
  <p>Kindly indicate your acceptance by signing the duplicate copy of this letter within seven (7) days.</p>
  <p>We look forward to having you on board.</p>
  ${sigBlock(ent.name, 'candidate_name', d)}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 2. Appointment Letter — TAS ───────────────────────────────────
const appointmentTas: LetterTemplate = {
  id: 'appointment_tas', name: 'Appointment Letter — TAS', category: 'Joining', entityScoped: ['TAS'],
  render(d) {
    const ent = ENTITY_CONFIG.TAS;
    return `
<div class="letter">
  ${masthead('TAS')}
  <div class="title">Letter of Appointment</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, 'TAS/APPT/2026/')}
  <div class="conf">Strictly Private &amp; Confidential</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>With reference to your acceptance of our Offer of Employment dated ${f(d, 'date')}, we are
  pleased to appoint you to the position of <strong>${f(d, 'designation')}</strong> in the
  <strong>${f(d, 'department')}</strong> function at <strong>${f(d, 'location')}</strong>, on the
  terms set out below.</p>
  <h4>1. Employer &amp; Regulatory Identity</h4>
  <p>Your employer is <strong>${esc(ent.name)}</strong> (CIN: ${esc(ent.cin)}), an AMFI-registered
  Mutual Fund Distributor (${esc(ent.registration)}). You are bound by the AMFI Code of Conduct
  for Mutual Fund Distributors and the Company's internal compliance framework.</p>
  <h4>2. Role, Grade, Reporting</h4>
  <p>Designation: <strong>${f(d, 'designation')}</strong> · Grade: <strong>${f(d, 'grade_band')}</strong> ·
  Reporting to: <strong>${f(d, 'reporting_manager')}</strong> (${f(d, 'reporting_manager_title')}) ·
  Work location: <strong>${f(d, 'location')}</strong>. Date of Joining: <strong>${f(d, 'date_of_joining')}</strong>.</p>
  <h4>3. Compensation</h4>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>4. Probation &amp; Confirmation</h4>
  <p>You will be on probation for ${f(d, 'probation_months')} months. The notice period during
  probation is one (1) week; post-confirmation, two (2) months.</p>
  <h4>5. Conflict of Interest — Mandatory Disclosure</h4>
  <p>You shall, both at appointment and annually thereafter, complete a Related-Party Disclosure
  declaring (a) whether any relative is, or is being proposed as, a Trustner POSP, agent, advisor,
  or in any other revenue-generating capacity; and (b) any other engagement that could constitute
  a conflict of interest with the Company's business.</p>
  <div class="box rose">
    <div class="bt">Prohibition on Related-Party POSP Arrangements</div>
    <p>No employee shall, directly or indirectly, hold, propose, sponsor, recommend, or
    facilitate the onboarding of any blood relative, spouse, parent-in-law, child, or extended
    family member as a POSP, agent, intermediary, advisor, or in any other revenue-generating
    capacity, with Trustner or any of its group entities. Any breach of this clause shall
    constitute misconduct and shall be ground for termination of employment.</p>
  </div>
  <h4>6. Hours, Leave, Travel</h4>
  <p>Working hours, leave entitlement, holidays, and travel policy shall be governed by the
  Company's HR Manual as amended from time to time. The current Comprehensive Leave Policy and
  Travel &amp; Expense Policy apply.</p>
  <h4>7. Confidentiality &amp; Employment Agreement</h4>
  <p>You shall execute the Company's Confidentiality &amp; Employment Agreement (CEA), the
  obligations under which shall apply during your employment and survive its termination as
  expressly provided therein.</p>
  <h4>8. Jurisdiction</h4>
  <p>This appointment shall be governed by Indian law. Courts at <strong>${esc(ent.jurisdiction)}</strong> shall have exclusive jurisdiction.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acceptance')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 3. Appointment Letter — TIB ───────────────────────────────────
const appointmentTib: LetterTemplate = {
  id: 'appointment_tib', name: 'Appointment Letter — TIB', category: 'Joining', entityScoped: ['TIB'],
  render(d) {
    const ent = ENTITY_CONFIG.TIB;
    return `
<div class="letter">
  ${masthead('TIB')}
  <div class="title">Letter of Appointment</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, 'TIB/APPT/2026/')}
  <div class="conf">Strictly Private &amp; Confidential</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>With reference to your acceptance of our Offer of Employment dated ${f(d, 'date')}, we are
  pleased to appoint you to the position of <strong>${f(d, 'designation')}</strong> in the
  <strong>${f(d, 'department')}</strong> function at <strong>${f(d, 'location')}</strong>.</p>
  <h4>1. Employer &amp; Regulatory Identity</h4>
  <p>Your employer is <strong>${esc(ent.name)}</strong> (CIN: ${esc(ent.cin)}), an IRDAI-licensed
  Direct Insurance Broker (${esc(ent.registration)}). You shall comply with the Insurance Act 1938,
  the IRDAI (Insurance Brokers) Regulations 2018, the IRDAI Master Circular on POSPs, and the
  IRDAI Code of Conduct for Intermediaries, as applicable.</p>
  <h4>2. Role, Grade, Reporting</h4>
  <p>Designation: <strong>${f(d, 'designation')}</strong> · Grade: <strong>${f(d, 'grade_band')}</strong> ·
  Reporting to: <strong>${f(d, 'reporting_manager')}</strong> · Work location: <strong>${f(d, 'location')}</strong>.
  Date of Joining: <strong>${f(d, 'date_of_joining')}</strong>.</p>
  <h4>3. Compensation</h4>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>4. Probation</h4>
  <p>You will be on probation for ${f(d, 'probation_months')} months. Notice in probation: one
  (1) week; post-confirmation: two (2) months.</p>
  <h4>5. Prohibition on Dual Coding (IRDAI)</h4>
  <p>You shall not hold any current insurance intermediary code (POSP, agent, specified person)
  with any other entity. Any such existing engagement must be disclosed and surrendered prior
  to joining. Continuing dual codes shall constitute misconduct.</p>
  <h4>6. Conflict of Interest — Mandatory Disclosure</h4>
  <p>You shall, both at appointment and annually thereafter, complete a Related-Party Disclosure
  declaring whether any relative is, or is being proposed as, a Trustner POSP, agent, advisor,
  or in any other revenue-generating capacity.</p>
  <div class="box rose">
    <div class="bt">Prohibition on Related-Party POSP Arrangements</div>
    <p>No employee shall, directly or indirectly, hold, propose, sponsor, recommend, or
    facilitate the onboarding of any blood relative, spouse, parent-in-law, child, or extended
    family member as a POSP, agent, intermediary, advisor, or in any other revenue-generating
    capacity, with Trustner or any of its group entities. Any breach of this clause shall
    constitute misconduct and shall be ground for termination of employment.</p>
  </div>
  <h4>7. Business Reporting &amp; MIS Integrity</h4>
  <p>All business pipeline data, leads, and MIS submissions made by you shall be true, accurate,
  and reflective of actual customer interactions. Falsified, padded, or fabricated reporting
  shall constitute misconduct and ground for termination, with recovery of any benefits
  (commission, incentive, bonus) attributable to such reporting.</p>
  <h4>8. Confidentiality &amp; Employment Agreement</h4>
  <p>You shall execute the Company's Confidentiality &amp; Employment Agreement, whose
  obligations shall apply during your employment and survive its termination as expressly
  provided therein.</p>
  <h4>9. Jurisdiction</h4>
  <p>This appointment shall be governed by Indian law. Courts at <strong>${esc(ent.jurisdiction)}</strong> shall have exclusive jurisdiction.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acceptance')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 4. Appointment Letter — Field Sales TIB ───────────────────────
const appointmentFieldSalesTib: LetterTemplate = {
  id: 'appointment_field_sales_tib', name: 'Appointment Letter — Field Sales (TIB)',
  category: 'Joining', entityScoped: ['TIB'],
  render(d) {
    const ent = ENTITY_CONFIG.TIB;
    return `
<div class="letter">
  ${masthead('TIB')}
  <div class="title">Appointment — Field Sales</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, 'TIB/APPT-FS/2026/')}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>You are appointed to the field-sales position of <strong>${f(d, 'designation')}</strong>
  in the <strong>${f(d, 'department')}</strong> channel at <strong>${f(d, 'location')}</strong>,
  reporting to <strong>${f(d, 'reporting_manager')}</strong>. DOJ: <strong>${f(d, 'date_of_joining')}</strong>.</p>
  <h4>1. Field-Sales Specific Obligations</h4>
  <ul>
    <li>Maintain a true MIS — every lead and pipeline entry must reflect an actual customer interaction.</li>
    <li>Submit a <strong>Quarterly Business Reporting Declaration</strong> certifying the accuracy of your MIS entries for the preceding quarter.</li>
    <li>Strictly observe attribution discipline — no routing of business under any POSP code that is held by a relative or in which you have a beneficial interest.</li>
    <li>Travel and expense claims shall be supported by original receipts and shall be subject to Company verification.</li>
  </ul>
  <h4>2. Compensation</h4>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>3. Dual-Coding Prohibition</h4>
  <p>You shall not hold any current insurance intermediary code with any other entity. Existing
  codes must be surrendered before joining.</p>
  <div class="box rose">
    <div class="bt">Related-Party POSP — Strict Prohibition</div>
    <p>Routing of business under a spouse's, parent's, sibling's, child's, or other relative's POSP
    code, or any concealment of such arrangement, shall constitute misconduct and shall result in
    termination plus recovery of all commissions / incentives attributable to such business.</p>
  </div>
  <h4>4. Notice &amp; Probation</h4>
  <p>Probation: ${f(d, 'probation_months')} months. Notice in probation: one (1) week; post-confirmation: two (2) months.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acceptance')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 5. Appointment Letter — Onsite ────────────────────────────────
const appointmentOnsite: LetterTemplate = {
  id: 'appointment_onsite', name: 'Appointment Letter — Onsite Deployment',
  category: 'Joining', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Appointment — Onsite Deployment</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, `${ec}/APPT-OS/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>You are appointed as <strong>${f(d, 'designation')}</strong>, with deployment at the client /
  onsite location: <strong>${f(d, 'client_onsite_location') || f(d, 'location')}</strong>.
  Your administrative reporting is to <strong>${f(d, 'reporting_manager')}</strong>.</p>
  <h4>1. Onsite Conduct</h4>
  <p>While deployed onsite, you shall observe the client's premises rules, dress code, and
  confidentiality requirements in addition to Company policies. Any conflict between client
  instructions and Company policy must be escalated to your reporting manager promptly.</p>
  <h4>2. Compensation</h4>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>3. Probation</h4>
  <p>Probation: ${f(d, 'probation_months')} months. Notice in probation: one (1) week; post-confirmation: two (2) months.</p>
  <h4>4. Confidentiality &amp; Conflict of Interest</h4>
  <p>You shall execute the Confidentiality &amp; Employment Agreement, Related-Party Disclosure,
  and ${esc(ent.regulator)} Compliance Acknowledgement before deployment.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acceptance')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 6. Appointment Letter — Contractual ───────────────────────────
const appointmentContractual: LetterTemplate = {
  id: 'appointment_contractual', name: 'Appointment Letter — Contractual',
  category: 'Joining', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Contractual Engagement</div>
  <div class="sub">${esc(ent.regulator)} ${esc(ent.registration)}</div>
  ${refLine(d, `${ec}/CONTR/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>${esc(ent.name)} engages you on a fixed-term contractual basis as <strong>${f(d, 'designation')}</strong>,
  effective from <strong>${f(d, 'contract_start')}</strong> until <strong>${f(d, 'contract_end')}</strong>,
  unless terminated earlier in accordance with the terms below.</p>
  <h4>1. Nature of Engagement</h4>
  <p>This is a fixed-term contractual engagement. It does not give rise to permanent employment,
  ongoing salary continuity beyond the contract term, or claim to permanent benefits.</p>
  <h4>2. Compensation</h4>
  ${ctcTable(d)}
  ${antiGamingBox}
  <h4>3. Notice &amp; Termination</h4>
  <p>Either party may terminate this engagement with 30 days' notice in writing, or pay in lieu.
  The Company may terminate forthwith for misconduct.</p>
  <h4>4. Confidentiality &amp; Compliance</h4>
  <p>You shall execute the Confidentiality &amp; Employment Agreement, Related-Party Disclosure,
  and ${esc(ent.regulator)} Compliance Acknowledgement at engagement.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Contractor Acceptance')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 7. Related-Party Disclosure ───────────────────────────────────
const relatedPartyDisclosure: LetterTemplate = {
  id: 'related_party_disclosure', name: 'Related-Party Disclosure',
  category: 'Compliance', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Related-Party Disclosure</div>
  <div class="sub">POSP / Intermediary Conflict-of-Interest Declaration</div>
  ${refLine(d, `${ec}/RPD/2026/`)}
  <p><b>To:</b> The Compliance Officer, ${esc(ent.name)}</p>
  <p><b>From:</b> ${f(d, 'candidate_name')} (${f(d, 'designation')}, ${f(d, 'location')})</p>
  <h4>Declaration A — Related Parties as Trustner POSPs / Intermediaries</h4>
  <p>I hereby declare that <strong>${f(d, 'related_party_yn')}</strong>, any of my relatives
  (spouse, parent, parent-in-law, child, sibling, or extended family) is engaged with Trustner or any of
  its group entities as a POSP, agent, advisor, intermediary, or in any other revenue-generating capacity.</p>
  <p>If "Yes," I disclose the following:</p>
  <p style="padding-left:18px"><i>${f(d, 'related_party_details')}</i></p>
  <h4>Declaration B — Other Intermediary Codes (TIB-specific where applicable)</h4>
  <p>I hereby declare that <strong>${f(d, 'other_intermediary_yn')}</strong>, I currently hold any
  insurance intermediary code (POSP, agent, specified person) with any other entity.</p>
  <p>If "Yes," I disclose the following:</p>
  <p style="padding-left:18px"><i>${f(d, 'other_intermediary_details')}</i></p>
  <h4>Acknowledgement</h4>
  <ol>
    <li>I understand that any related-party POSP arrangement (existing or proposed) must be disclosed in advance and is subject to a documented exception or rejection by the Compliance function.</li>
    <li>I understand that concealment of any related-party arrangement, or routing of business under a relative's POSP code, shall constitute misconduct under the Confidentiality &amp; Employment Agreement and ground for termination plus disgorgement of attributable benefits.</li>
    <li>I shall re-attest this declaration annually on the cycle date specified by HR.</li>
  </ol>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Signature')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 8. IRDAI Compliance Acknowledgement ───────────────────────────
const irdaiAck: LetterTemplate = {
  id: 'irdai_acknowledgement', name: 'IRDAI Compliance Acknowledgement',
  category: 'Compliance', entityScoped: ['TIB'],
  render(d) {
    const ent = ENTITY_CONFIG.TIB;
    return `
<div class="letter">
  ${masthead('TIB')}
  <div class="title">IRDAI Compliance Acknowledgement</div>
  <div class="sub">${esc(ent.registration)}</div>
  ${refLine(d, 'TIB/IRDAI-ACK/2026/')}
  <p>I, <strong>${f(d, 'candidate_name')}</strong>, acknowledge and agree as follows:</p>
  <ol>
    <li>I am bound by the Insurance Act, 1938 and rules thereunder; the IRDAI (Insurance Brokers) Regulations, 2018; the IRDAI Master Circular on POSPs; and the IRDAI Code of Conduct for Intermediaries, as applicable to my role.</li>
    <li>I shall not hold any current insurance intermediary code (POSP, agent, specified person) with any other entity. Existing codes have been disclosed and shall be surrendered prior to active deployment.</li>
    <li>I shall maintain professional indemnity and confidentiality of customer information, and shall complete all training and certification required by IRDAI and by the Company.</li>
    <li>I shall not engage in any insurance-related solicitation, advisory, or sales activity for any party other than the Company without the Company's prior written consent.</li>
    <li>I shall cooperate fully with any IRDAI or internal compliance enquiry and shall produce records and explanations as required.</li>
  </ol>
  <p>I confirm that the disclosures made by me in the Related-Party Disclosure and the Background
  Verification Authorisation are true and complete to the best of my knowledge.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Signature')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 9. Background Verification Authorisation ──────────────────────
const bgvAuth: LetterTemplate = {
  id: 'bgv_authorization', name: 'Background Verification Authorisation',
  category: 'Compliance', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Background Verification — Authorisation &amp; Consent</div>
  <div class="sub">DPDPA-Compliant Consent for Verification</div>
  ${refLine(d, `${ec}/BGV/2026/`)}
  <p>I, <strong>${f(d, 'candidate_name')}</strong>, hereby authorise ${esc(ent.name)} (or its
  authorised verification vendor) to conduct background verification checks on me, including but
  not limited to:</p>
  <ol>
    <li>Confirmation of identity and address from PAN, Aadhaar, passport, or driving licence records.</li>
    <li>Verification of education qualifications from issuing institutions.</li>
    <li>Verification of past employment from prior employers, including reasons for leaving.</li>
    <li>Cross-check against regulator databases — IRDAI (for insurance roles), AMFI (for MF distribution roles), and any other applicable regulator.</li>
    <li>Credit bureau enquiry (CIBIL) for senior roles or roles handling Company finances.</li>
    <li>Litigation database checks against criminal and civil records.</li>
  </ol>
  <p>I confirm my consent under the Digital Personal Data Protection Act, 2023 (DPDPA) — this
  consent is specific, informed, and purpose-limited to the background verification process. The
  data so collected shall be retained for the periods specified in the Company's Data Retention
  Policy.</p>
  <p>I acknowledge that any adverse finding or discrepancy discovered during or after employment
  shall be ground to withdraw the offer or terminate the employment, as the case may be.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Consent')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 10. NDA ───────────────────────────────────────────────────────
const nda: LetterTemplate = {
  id: 'nda', name: 'Non-Disclosure Agreement', category: 'Compliance', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Non-Disclosure Agreement (NDA)</div>
  ${refLine(d, `${ec}/NDA/2026/`)}
  <p>This NDA is entered into between <strong>${esc(ent.name)}</strong> (the "Company") and
  <strong>${f(d, 'candidate_name')}</strong> (the "Recipient") effective <strong>${f(d, 'date')}</strong>.</p>
  <h4>1. Confidential Information</h4>
  <p>"Confidential Information" means all non-public, proprietary, business, financial,
  technical, customer, advisor, regulatory, or operational information of the Company or its
  group entities, in any form, that the Recipient has access to during employment.</p>
  <h4>2. Obligations</h4>
  <p>The Recipient shall:</p>
  <ol>
    <li>Hold all Confidential Information in strict confidence.</li>
    <li>Use it solely for the purpose of performing the Recipient's duties.</li>
    <li>Not disclose it to any third party without the Company's prior written consent.</li>
    <li>Return or securely destroy all Confidential Information upon cessation of employment.</li>
    <li>Continue to be bound by confidentiality obligations for a period of five (5) years after cessation, subject to longer periods where required by regulation.</li>
  </ol>
  <h4>3. Exclusions</h4>
  <p>This NDA does not cover information that is (a) publicly known through no breach by the
  Recipient, (b) lawfully received from a third party with no obligation of confidence, or
  (c) independently developed without use of the Company's Confidential Information.</p>
  <h4>4. Remedies</h4>
  <p>The Recipient acknowledges that any breach may cause irreparable harm and the Company shall
  be entitled to injunctive relief in addition to damages.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Recipient Signature')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 11. Non-Compete & Non-Solicitation ────────────────────────────
const nonCompete: LetterTemplate = {
  id: 'non_compete', name: 'Non-Compete &amp; Non-Solicitation',
  category: 'Compliance', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Non-Compete &amp; Non-Solicitation Agreement</div>
  ${refLine(d, `${ec}/NCNS/2026/`)}
  <p>This agreement is between <strong>${esc(ent.name)}</strong> and <strong>${f(d, 'candidate_name')}</strong>,
  effective from <strong>${f(d, 'date_of_joining')}</strong>.</p>
  <h4>1. Non-Solicitation of Customers / Advisors</h4>
  <p>For a period of two (2) years after cessation of employment, the Employee shall not, directly
  or indirectly, solicit, induce, or persuade any customer, POSP, advisor, or intermediary of the
  Company with whom the Employee had material contact during the last 24 months of employment, to
  cease doing business with the Company or to transact with a competing entity.</p>
  <h4>2. Non-Solicitation of Employees</h4>
  <p>For a period of one (1) year after cessation, the Employee shall not solicit, hire, or
  attempt to hire any current employee, officer, or contractor of the Company.</p>
  <h4>3. Non-Compete</h4>
  <p>For a period of six (6) months after cessation, the Employee shall not, within the territory
  in which the Employee operated during the last 12 months of employment, accept employment with,
  or render services to, a directly competing AMFI-registered MFD or IRDAI-licensed Insurance
  Broker. This restriction is limited to the role and territory of the Employee's last assignment
  and is enforceable to the extent permitted by applicable law.</p>
  <h4>4. Family-Member Restrictions</h4>
  <p>The Employee shall not, through any spouse, relative, or beneficially-controlled entity,
  circumvent the obligations under Clauses 1-3 above.</p>
  <h4>5. Remedies</h4>
  <p>Breach shall entitle the Company to seek injunctive relief and damages, in addition to
  forfeiture / clawback of any benefits attributable to the breach.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Signature')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 12. Probation Confirmation ────────────────────────────────────
const probationConfirmation: LetterTemplate = {
  id: 'probation_confirmation', name: 'Probation Confirmation',
  category: 'Tenure', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Confirmation of Employment</div>
  ${refLine(d, `${ec}/CONF/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>We are pleased to confirm your employment with <strong>${esc(ent.name)}</strong> following
  the satisfactory completion of your probationary period from <strong>${f(d, 'probation_start_date')}</strong>
  to <strong>${f(d, 'probation_end_date')}</strong>.</p>
  <p>Based on the assessment of your performance, attendance, conduct, and compliance during the
  probation period (overall rating: <strong>${f(d, 'performance_rating')}</strong>), your services
  are hereby confirmed with effect from <strong>${f(d, 'effective_date')}</strong>.</p>
  <h4>Terms upon Confirmation</h4>
  <ul>
    <li>The standard notice period of two (2) months shall apply from either side.</li>
    <li>You shall remain bound by the Confidentiality &amp; Employment Agreement and the related compliance instruments executed at appointment.</li>
    <li>You shall complete the Annual COI Re-Attestation on the next cycle date (April 1).</li>
  </ul>
  <p>Congratulations on your confirmation. We look forward to your continued contribution.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acknowledgement')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 13. Increment Letter ──────────────────────────────────────────
const incrementLetter: LetterTemplate = {
  id: 'increment', name: 'Increment Letter', category: 'Tenure', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Salary Increment Letter</div>
  ${refLine(d, `${ec}/INC/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>In recognition of your performance and continued contribution to ${esc(ent.name)}, we are
  pleased to inform you of the following revision to your compensation, effective <strong>${f(d, 'effective_date')}</strong>:</p>
  <table class="kv">
    <tr><td class="k">Previous CTC (annual)</td><td>₹ ${inr(d.prev_total_ctc_annual)}</td></tr>
    <tr><td class="k">Revised CTC (annual)</td><td><b>₹ ${inr(d.new_total_ctc_annual || d.total_ctc_annual)}</b></td></tr>
    <tr><td class="k">Increment %</td><td>${f(d, 'increment_percent')}%</td></tr>
  </table>
  <p>The revised CTC structure is as below:</p>
  ${ctcTable(d)}
  ${antiGamingBox}
  <p>All other terms of your appointment remain unchanged. You shall continue to comply with the
  Conflict-of-Interest, Related-Party Disclosure, and ${esc(ent.regulator)} obligations under
  your appointment.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acknowledgement')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 14. Promotion Letter ──────────────────────────────────────────
const promotionLetter: LetterTemplate = {
  id: 'promotion', name: 'Promotion Letter', category: 'Tenure', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Promotion Letter</div>
  ${refLine(d, `${ec}/PROMO/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>We are pleased to inform you of your promotion within <strong>${esc(ent.name)}</strong>,
  effective <strong>${f(d, 'effective_date')}</strong>:</p>
  <table class="kv">
    <tr><td class="k">From</td><td>${f(d, 'previous_designation')}</td></tr>
    <tr><td class="k">To</td><td><b>${f(d, 'new_designation') || f(d, 'designation')}</b></td></tr>
    <tr><td class="k">Department / Grade</td><td>${f(d, 'department')} · ${f(d, 'grade_band')}</td></tr>
    <tr><td class="k">Reports to</td><td>${f(d, 'reporting_manager')}</td></tr>
  </table>
  <p>Your revised compensation is as below:</p>
  ${ctcTable(d)}
  ${antiGamingBox}
  <p>All other terms of your appointment, including the Confidentiality &amp; Employment
  Agreement and ${esc(ent.regulator)} obligations, remain unchanged and in force.</p>
  <p>Congratulations and best wishes for success in your new role.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acknowledgement')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 15. Warning Letter ────────────────────────────────────────────
const warningLetter: LetterTemplate = {
  id: 'warning', name: 'Warning Letter', category: 'Discipline', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">${f(d, 'warning_level') || 'Warning Letter'}</div>
  ${refLine(d, `${ec}/WARN/2026/`)}
  <div class="conf">Strictly Private &amp; Confidential</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>This is to formally place on record the Company's concern in respect of the following
  conduct / performance issue:</p>
  <div class="box rose">
    <div class="bt">Description</div>
    <p>${f(d, 'violation_description')}</p>
    <p><i>Date of incident / period: ${f(d, 'incident_date')}</i></p>
  </div>
  <h4>Expected Conduct</h4>
  <p>Your conduct in this regard is not consistent with the Company's Code of Conduct and your
  obligations under the Confidentiality &amp; Employment Agreement and ${esc(ent.regulator)}
  compliance framework. You are required to:</p>
  <ol>
    <li>Cease the conduct described above with immediate effect.</li>
    <li>Take corrective action and demonstrate sustained improvement in the next 60 days.</li>
    <li>Cooperate fully with any review the Company may conduct.</li>
  </ol>
  <p>This is a <strong>${f(d, 'warning_level')}</strong>. Any repetition or further breach shall
  invite escalated action, including a Show-Cause Notice and termination of employment.</p>
  <p>A copy of this letter shall be placed in your personnel file.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acknowledgement')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 16. Show Cause Notice ─────────────────────────────────────────
const showCauseNotice: LetterTemplate = {
  id: 'show_cause', name: 'Show-Cause Notice', category: 'Discipline', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Show-Cause Notice</div>
  ${refLine(d, `${ec}/SCN/2026/`)}
  <div class="conf">Strictly Private &amp; Confidential</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>The Company has come into possession of information that, on its face, indicates the
  following conduct on your part:</p>
  <div class="box rose">
    <div class="bt">Allegation</div>
    <p>${f(d, 'violation_description')}</p>
    <p><i>Date / period of alleged conduct: ${f(d, 'incident_date')}</i></p>
    <p><b>Summary of evidence on record:</b> ${f(d, 'evidence_summary')}</p>
  </div>
  <h4>Show-Cause</h4>
  <p>The above conduct, if established, would constitute misconduct under your appointment, the
  Confidentiality &amp; Employment Agreement, and the ${esc(ent.regulator)} compliance framework.
  You are hereby called upon to <strong>show cause in writing</strong> why disciplinary action,
  including but not limited to termination of employment and recovery of attributable benefits,
  should not be taken against you.</p>
  <h4>Response Deadline</h4>
  <p>Your written response, with any supporting documents, must reach the undersigned by
  <strong>${f(d, 'response_deadline')}</strong>. Failure to respond by the deadline shall be
  treated as acceptance of the allegations and the Company shall proceed accordingly.</p>
  <h4>Natural Justice</h4>
  <p>You shall be afforded a reasonable opportunity to be heard. You may also request copies of
  the documents the Company is relying upon for the purpose of preparing your reply.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Receipt Acknowledged')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 17. Resignation Acceptance ────────────────────────────────────
const resignationAcceptance: LetterTemplate = {
  id: 'resignation_acceptance', name: 'Resignation Acceptance Letter',
  category: 'Exit', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Resignation Acceptance</div>
  ${refLine(d, `${ec}/RES-ACC/2026/`)}
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>This refers to your resignation dated <strong>${f(d, 'resignation_date')}</strong>. We accept
  your resignation. Your last working day shall be <strong>${f(d, 'last_working_date')}</strong>.
  Notice period status: <strong>${f(d, 'notice_period_status')}</strong>.</p>
  <h4>Exit Deliverables</h4>
  <ol>
    <li>Return of all Company assets — laptop, mobile, ID card, credentials, files.</li>
    <li>Handover of pending business and closure of pending entries in MIS.</li>
    <li>Clearance sign-off from each function — Sales, HR, Compliance, IT, Finance.</li>
    <li>Submission of pending reimbursement claims by the LWD.</li>
  </ol>
  <h4>Post-Employment Obligations</h4>
  <p>You remain bound by the surviving obligations of the Confidentiality &amp; Employment
  Agreement, including: non-disclosure of Confidential Information, non-solicitation of customers
  and POSPs for two (2) years, non-solicitation of employees for one (1) year, and the
  family-member restrictions under Clause 4(c) of the CEA.</p>
  <h4>Full &amp; Final Settlement</h4>
  <p>Your F&amp;F shall be processed within 45 days from the LWD, subject to clearance from each
  function. The Company reserves the right to make deductions or adjustments for any pending
  recoveries, asset returns, or matters under review.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Employee Acknowledgement')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 18. Termination Letter ────────────────────────────────────────
const terminationLetter: LetterTemplate = {
  id: 'termination', name: 'Termination Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    const isMisconduct = String(d.termination_ground || '').toLowerCase().includes('misconduct');
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Termination of Employment</div>
  ${refLine(d, `${ec}/TERM/2026/`)}
  <div class="conf">Strictly Private &amp; Confidential</div>
  <p>Dear ${f(d, 'candidate_name')},</p>
  <p>This refers to ${isMisconduct
    ? 'the Show-Cause Notice issued to you, your response thereto, and the Company\'s subsequent inquiry. After due consideration of the evidence and your representations, the Company has decided that your conduct constitutes a breach of the Confidentiality &amp; Employment Agreement and the applicable regulatory framework.'
    : 'the Company\'s review of your engagement.'}</p>
  <p>Accordingly, your employment with <strong>${esc(ent.name)}</strong> stands terminated with
  effect from <strong>${f(d, 'last_working_date')}</strong> on the ground:
  <strong>${f(d, 'termination_ground')}</strong>.</p>
  ${isMisconduct ? `
  <div class="box rose">
    <div class="bt">Specific Breaches</div>
    <p>${f(d, 'violation_description')}</p>
  </div>
  <h4>Recovery &amp; Clawback</h4>
  <p>The Company hereby reserves and shall enforce its rights under Clauses 3(a), 3(d), and 3(f)
  of the Confidentiality &amp; Employment Agreement to recover any commissions, incentives,
  bonuses, or other benefits attributable to the conduct found.</p>
  ` : `
  <p>The Company shall pay notice in full / in lieu, in accordance with your appointment terms.</p>
  `}
  <h4>Exit Deliverables</h4>
  <p>You shall return all Company assets, surrender all credentials and access, and complete the
  clearance protocol immediately. You shall continue to be bound by the surviving obligations of
  the Confidentiality &amp; Employment Agreement, including confidentiality and non-solicitation.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'Receipt Acknowledged')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 19. Relieving Letter ──────────────────────────────────────────
const relievingLetter: LetterTemplate = {
  id: 'relieving', name: 'Relieving Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Relieving Letter</div>
  ${refLine(d, `${ec}/REL/2026/`)}
  <p>To Whom It May Concern,</p>
  <p>This is to confirm that <strong>${f(d, 'candidate_name')}</strong> was employed with
  <strong>${esc(ent.name)}</strong> as <strong>${f(d, 'designation')}</strong> in the
  <strong>${f(d, 'department')}</strong> function, based at <strong>${f(d, 'location')}</strong>,
  from <strong>${f(d, 'date_of_joining')}</strong> until <strong>${f(d, 'last_working_date')}</strong>.</p>
  <p>${f(d, 'candidate_name')} has been duly relieved from the services of the Company effective
  the close of business on the last working date stated above, having completed all exit
  formalities including handover of pending work, return of Company assets, and clearance from
  all relevant functions.</p>
  <p>We wish ${f(d, 'candidate_name')} success in future endeavours.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'For the Company')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── 20. Experience Letter ─────────────────────────────────────────
const experienceLetter: LetterTemplate = {
  id: 'experience', name: 'Experience Letter', category: 'Exit', entityScoped: ['TAS', 'TIB'],
  render(d) {
    const ec = entityOf(d); const ent = ENTITY_CONFIG[ec];
    return `
<div class="letter">
  ${masthead(ec)}
  <div class="title">Experience Letter</div>
  ${refLine(d, `${ec}/EXP/2026/`)}
  <p>To Whom It May Concern,</p>
  <p>This is to certify that <strong>${f(d, 'candidate_name')}</strong> was employed with
  <strong>${esc(ent.name)}</strong> from <strong>${f(d, 'tenure_from') || f(d, 'date_of_joining')}</strong>
  to <strong>${f(d, 'tenure_to') || f(d, 'last_working_date')}</strong>.</p>
  <p>During this period, ${f(d, 'candidate_name')} served in the role of
  <strong>${f(d, 'designation')}</strong> within the <strong>${f(d, 'department')}</strong>
  function, based at <strong>${f(d, 'location')}</strong>.</p>
  <p>${f(d, 'candidate_name')} was a sincere and committed member of our team and contributed
  meaningfully to the Company's objectives during the tenure of service.</p>
  <p>We wish ${f(d, 'candidate_name')} success and growth in future endeavours.</p>
  ${sigBlock(ent.name, 'candidate_name', d, 'For the Company')}
  ${footer('2.0')}
</div>`;
  },
};

// ─── Registry ──────────────────────────────────────────────────────
export const LETTER_REGISTRY: readonly LetterTemplate[] = [
  offerLetter,
  appointmentTas,
  appointmentTib,
  appointmentFieldSalesTib,
  appointmentOnsite,
  appointmentContractual,
  relatedPartyDisclosure,
  irdaiAck,
  bgvAuth,
  nda,
  nonCompete,
  probationConfirmation,
  incrementLetter,
  promotionLetter,
  warningLetter,
  showCauseNotice,
  resignationAcceptance,
  terminationLetter,
  relievingLetter,
  experienceLetter,
];

export function getLetterTemplate(id: string): LetterTemplate | null {
  return LETTER_REGISTRY.find((t) => t.id === id) || null;
}

/**
 * Standard joining-letter pack per entity — generated in one click from an
 * employee/candidate record. (Ram-confirmed Jun 16 2026.)
 *   TAS: Offer + Appointment-TAS + NDA + Non-Compete + Related-Party + BGV
 *   TIB: the above + IRDAI Compliance Acknowledgement
 */
export const LETTER_PACKS: Record<'TAS' | 'TIB', string[]> = {
  TAS: ['offer', 'appointment_tas', 'nda', 'non_compete', 'related_party_disclosure', 'bgv_authorization'],
  TIB: ['offer', 'appointment_tib', 'nda', 'non_compete', 'related_party_disclosure', 'bgv_authorization', 'irdai_acknowledgement'],
};

export function getLetterPack(entity: 'TAS' | 'TIB'): LetterTemplate[] {
  return LETTER_PACKS[entity]
    .map((id) => getLetterTemplate(id))
    .filter((t): t is LetterTemplate => t !== null);
}

/** Serial-number prefix for a given template + entity (e.g. "TAS/OFFER/2026/"). */
export function serialPrefix(entity: 'TAS' | 'TIB', templateId: string): string {
  const map: Record<string, string> = {
    offer: 'OFFER', appointment_tas: 'APPT', appointment_tib: 'APPT',
    appointment_field_sales_tib: 'APPT-FS', appointment_onsite: 'APPT-OS', appointment_contractual: 'CONTR',
    related_party_disclosure: 'RPD', irdai_acknowledgement: 'IRDAI-ACK', bgv_authorization: 'BGV',
    nda: 'NDA', non_compete: 'NCNS', probation_confirmation: 'CONF', increment: 'INC', promotion: 'PROMO',
    warning: 'WARN', show_cause: 'SCN', resignation_acceptance: 'RES-ACC', termination: 'TERM',
    relieving: 'REL', experience: 'EXP',
  };
  return `${entity}/${map[templateId] || templateId.toUpperCase()}/2026/`;
}
