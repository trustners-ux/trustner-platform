'use client';

/**
 * Trustner CTC Structure Designer — for HR signoff
 * Route: /employee/hr/salary-structure-preview
 *
 * Two tracks:
 *  - PERMANENT — Basic/HRA/Conv/Other; Basic = 50% of Gross (Code on Wages compliant)
 *  - SALES/RM/CDM — Fixed base + Variable + Bonus + Travel (at-risk pool carved
 *    OUT of CTC first; Fixed Gross = CTC − AtRisk − Employer benefits)
 *
 * Three PF modes (Trustner Standard ₹1,800 default), ESIC auto-toggle at ₹21k.
 * Full statutory compliance engine — see lib/hr/statutory-validator.ts.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, ShieldCheck, ShieldAlert, ShieldX, FileDown } from 'lucide-react';
import {
  validateStatutoryCompliance,
  MIN_WAGES_SKILLED_MONTHLY,
  ptMonthly,
  pfFor,
  type StateCode,
  type PfMode,
  type Track,
  type EmploymentType,
  type SalaryStructure,
} from '@/lib/hr/statutory-validator';

interface Inputs {
  track: Track;
  pfMode: PfMode;
  state: StateCode;
  employmentType: EmploymentType;
  targetCtcMonthly: number;
  basicPctOfGross: number;
  /** HRA as % of Basic. Default capped at Sec 10(13A) limit (40% non-metro / 50% metro).
   *  Excess is structurally pushed to Special Allowance — same tax outcome, cleaner labels. */
  hraPctOfBasic: number;
  /** Conveyance fixed at ₹1,600 (post-Finance Act 2018; exemption withdrawn but legacy structural). */
  conveyanceFixed: number;
  /** Carve Statutory Bonus (8.33% × min(Basic, max(₹7k, state MW)) into CTC. */
  includeStatutoryBonus: boolean;
  variablePctOfCtc: number;
  perfBonusPctOfCtc: number;
  travelMonthly: number;
  medicalInsuranceMonthly: number;
}

const DEFAULTS: Inputs = {
  track: 'permanent',
  pfMode: 'fixed_1800',
  state: 'Assam',
  employmentType: 'permanent',
  targetCtcMonthly: 30064,
  basicPctOfGross: 0.50,
  // Sec 10(13A) tax-exempt cap: 50% for Delhi/Mumbai/Kolkata/Chennai, 40% for rest.
  // We default to 40% (non-metro Assam HQ). HR can raise to 50% if employee in metro.
  hraPctOfBasic: 0.40,
  conveyanceFixed: 1600,
  includeStatutoryBonus: true,
  variablePctOfCtc: 0.15,
  perfBonusPctOfCtc: 0.05,
  travelMonthly: 2500,
  medicalInsuranceMonthly: 607,
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

function compute(i: Inputs): SalaryStructure {
  const ctc = +i.targetCtcMonthly || 0;
  const isSales = i.track === 'sales';

  const variable = isSales ? ctc * i.variablePctOfCtc : 0;
  const perfBonus = isSales ? ctc * i.perfBonusPctOfCtc : 0;
  const travel = isSales ? +i.travelMonthly : 0;
  const atRisk = variable + perfBonus + travel;

  // Statutory bonus base = max(₹7k, state MW). Trustner's HRMS uses Assam → ₹11,648.
  const mw = MIN_WAGES_SKILLED_MONTHLY[i.state] || 0;
  const bonusBaseCap = Math.max(7000, mw);

  let basic = 0, hra = 0, conv = 0, otherAllowance = 0, statutoryBonus = 0;
  let employerEpf = 0, gratuity = 0, esicEr = 0, medical = 0;
  let isEsic = false;
  let fixedGross = Math.max(0, ctc - atRisk - 2500);

  for (let p = 0; p < 10; p++) {
    if (isSales) {
      basic = Math.max(ctc * 0.30, 8000);
    } else {
      basic = fixedGross * i.basicPctOfGross;
    }
    // Statutory bonus: 8.33% of min(Basic, bonusBaseCap), monthly accrual.
    statutoryBonus = i.includeStatutoryBonus && basic <= 21000
      ? Math.min(basic, bonusBaseCap) * 0.0833
      : 0;
    employerEpf = pfFor(basic, i.pfMode);
    gratuity = basic * 0.0481;
    isEsic = fixedGross <= 21000;
    esicEr = isEsic ? fixedGross * 0.0325 : 0;
    medical = isEsic ? 0 : +i.medicalInsuranceMonthly;

    // Statutory bonus is inside CTC but paid annually — accrual reduces room
    // for monthly allowances. Gross (monthly take-home base) = Basic + HRA + Conv + Other.
    // The bonus accrual is shown separately as an annual line.
    const targetFixed = Math.max(0, ctc - atRisk - employerEpf - gratuity - esicEr - medical - statutoryBonus);

    if (isSales) {
      conv = Math.min(i.conveyanceFixed, Math.max(0, targetFixed - basic));
      const remain = Math.max(0, targetFixed - basic - conv);
      hra = Math.min(basic * 0.40, remain);
      otherAllowance = Math.max(0, targetFixed - basic - hra - conv);
    } else {
      hra = basic * i.hraPctOfBasic;
      conv = i.conveyanceFixed;
      otherAllowance = Math.max(0, targetFixed - basic - hra - conv);
    }
    const newFixed = basic + hra + conv + otherAllowance;
    if (Math.abs(newFixed - fixedGross) < 1) { fixedGross = newFixed; break; }
    fixedGross = newFixed;
  }

  const employeeEpf = pfFor(basic, i.pfMode);
  const pt = ptMonthly(i.state, fixedGross);
  const esicEe = isEsic ? fixedGross * 0.0075 : 0;
  const net = fixedGross - employeeEpf - pt - esicEe;

  return {
    track: i.track,
    state: i.state,
    pfMode: i.pfMode,
    employmentType: i.employmentType,
    basic, hra, conveyance: conv, otherAllowance,
    statutoryBonus,
    variable, perfBonus, travel,
    gross: fixedGross,
    employerEpf, gratuity, esicEr, medical,
    employeeEpf, pt, esicEe, net,
    ctc,
    isEsic,
  };
}

const STATE_OPTIONS: { group: string; states: { code: StateCode; label: string }[] }[] = [
  { group: 'North-East', states: [
    { code: 'Assam', label: 'Assam' },
    { code: 'Tripura', label: 'Tripura' },
    { code: 'Meghalaya', label: 'Meghalaya' },
    { code: 'Nagaland', label: 'Nagaland' },
    { code: 'Manipur', label: 'Manipur' },
    { code: 'Mizoram', label: 'Mizoram' },
    { code: 'Arunachal', label: 'Arunachal Pradesh' },
    { code: 'Sikkim', label: 'Sikkim' },
  ]},
  { group: 'East', states: [
    { code: 'WB', label: 'West Bengal' },
    { code: 'Bihar', label: 'Bihar' },
    { code: 'Jharkhand', label: 'Jharkhand' },
    { code: 'Odisha', label: 'Odisha' },
  ]},
  { group: 'North', states: [
    { code: 'Delhi', label: 'Delhi (NCT)' },
    { code: 'UP', label: 'Uttar Pradesh' },
    { code: 'Haryana', label: 'Haryana' },
    { code: 'Punjab', label: 'Punjab' },
    { code: 'Rajasthan', label: 'Rajasthan' },
    { code: 'Uttarakhand', label: 'Uttarakhand' },
    { code: 'HP', label: 'Himachal Pradesh' },
    { code: 'JK', label: 'Jammu & Kashmir' },
  ]},
  { group: 'West', states: [
    { code: 'MH', label: 'Maharashtra' },
    { code: 'Gujarat', label: 'Gujarat' },
    { code: 'Goa', label: 'Goa' },
    { code: 'MP', label: 'Madhya Pradesh' },
    { code: 'Chhattisgarh', label: 'Chhattisgarh' },
  ]},
  { group: 'South', states: [
    { code: 'KA', label: 'Karnataka' },
    { code: 'TN', label: 'Tamil Nadu' },
    { code: 'Kerala', label: 'Kerala' },
    { code: 'AP', label: 'Andhra Pradesh' },
    { code: 'Telangana', label: 'Telangana' },
    { code: 'Puducherry', label: 'Puducherry' },
  ]},
];

export default function SalaryStructurePreviewPage() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const r = useMemo(() => compute(inputs), [inputs]);
  const comp = useMemo(() => validateStatutoryCompliance(r), [r]);
  const update = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInputs(s => ({ ...s, [k]: v }));

  const atRisk = r.variable + r.perfBonus + r.travel;
  const onTargetGross = r.gross + atRisk;
  const totalDed = r.employeeEpf + r.pt + r.esicEe;
  const mwFloor = MIN_WAGES_SKILLED_MONTHLY[inputs.state] || 0;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/employee/hr" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> HR Workbench
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-1 rounded">Preview · Not Saved</span>
        </div>

        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-sky-700" />
          Trustner CTC Structure Designer
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Interactive preview with full statutory compliance engine. Show this to HR before the offer letter template is locked.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* LEFT — Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-extrabold mb-4 flex items-center gap-2">⚙ Configuration</h2>

            {/* Track */}
            <Label>Role Track</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <TrackBtn active={inputs.track === 'permanent'} onClick={() => update('track', 'permanent')} title="Permanent / Service" sub="Fixed" />
              <TrackBtn active={inputs.track === 'sales'} onClick={() => update('track', 'sales')} title="Sales / RM / CDM" sub="Fixed + Variable" />
            </div>

            {/* Employment Type */}
            <Label>Employment Type</Label>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              {(['permanent', 'fixed_term', 'intern', 'consultant'] as EmploymentType[]).map(et => (
                <button
                  key={et}
                  onClick={() => update('employmentType', et)}
                  className={`px-3 py-2 rounded-lg border font-semibold capitalize ${inputs.employmentType === et ? 'bg-cyan-50 border-cyan-500 text-cyan-800' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  {et.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* PF Mode */}
            <Label>PF Mode</Label>
            <div className="space-y-2 mb-3">
              <PfBtn active={inputs.pfMode === 'fixed_1800'} onClick={() => update('pfMode', 'fixed_1800')} title="Trustner Standard — Fixed ₹1,800 EPF" desc="PF paid on ₹15k statutory ceiling regardless of actual basic. Most common Trustner default." />
              <PfBtn active={inputs.pfMode === 'standard'} onClick={() => update('pfMode', 'standard')} title="12% of Actual Basic (no ceiling boost)" desc="For employees with basic > ₹15k who want full 12% contribution." />
              <PfBtn active={inputs.pfMode === 'opted_out'} onClick={() => update('pfMode', 'opted_out')} title="No EPF (Form-11 declaration)" desc="Only legal if Basic > ₹15k AND employee never drew EPF before. Sign Form 11; add to CTC as cash." />
            </div>

            {/* CTC + State */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label>Target Monthly CTC</Label>
                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" value={inputs.targetCtcMonthly} onChange={e => update('targetCtcMonthly', +e.target.value || 0)} />
              </div>
              <div>
                <Label>State (PT + Min Wage)</Label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={inputs.state} onChange={e => update('state', e.target.value as StateCode)}>
                  {STATE_OPTIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.states.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                {mwFloor > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">Skilled MW floor: ₹{fmt(mwFloor)}/mo</p>
                )}
              </div>
            </div>

            {/* Medical (above ₹21k) */}
            {!r.isEsic && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">Gross &gt; ₹21k · ESIC off · Medical premium required</div>
                <Label>Medical Insurance Premium (monthly, HR enters)</Label>
                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" value={inputs.medicalInsuranceMonthly} onChange={e => update('medicalInsuranceMonthly', +e.target.value || 0)} />
              </div>
            )}

            {/* Sales mix */}
            {inputs.track === 'sales' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-2">Variable Mix — Pay Only on Hit</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Variable %</Label>
                    <input type="number" step="0.01" min="0" max="0.5" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-xs" value={inputs.variablePctOfCtc} onChange={e => update('variablePctOfCtc', Math.max(0, Math.min(0.5, +e.target.value || 0)))} />
                    <p className="text-[9px] text-amber-700 mt-1">paid quarterly on goal-hit</p>
                  </div>
                  <div>
                    <Label>Perf Bonus %</Label>
                    <input type="number" step="0.01" min="0" max="0.3" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-xs" value={inputs.perfBonusPctOfCtc} onChange={e => update('perfBonusPctOfCtc', Math.max(0, Math.min(0.3, +e.target.value || 0)))} />
                    <p className="text-[9px] text-amber-700 mt-1">annual on rating ≥ 4</p>
                  </div>
                  <div>
                    <Label>Travel ₹/mo</Label>
                    <input type="number" min="0" className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-xs" value={inputs.travelMonthly} onChange={e => update('travelMonthly', +e.target.value || 0)} />
                    <p className="text-[9px] text-amber-700 mt-1">reimburse on bills</p>
                  </div>
                </div>
                <p className="text-[10px] text-amber-900 mt-2 leading-snug">
                  Variable + Bonus + Travel <b>do not become a fixed cost</b>. If the RM misses targets, those components are simply not paid. Fixed Basic + HRA + Conv + Other is the only floor.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Output */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2">
              Computed Breakup
              <Pill color="gray">{inputs.track.toUpperCase()}</Pill>
              <Pill color="gray">{inputs.pfMode.toUpperCase()}</Pill>
              <Pill color={r.isEsic ? 'red' : 'green'}>{r.isEsic ? 'ESIC ON' : 'MEDICAL'}</Pill>
            </h2>

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-sky-800 text-white">
                  <th className="text-left px-3 py-2">Particulars</th>
                  <th className="text-right px-3 py-2">Monthly</th>
                  <th className="text-right px-3 py-2">Yearly</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Basic" m={r.basic} />
                <Row label="HRA" m={r.hra} />
                <Row label="Conveyance" m={r.conveyance} />
                <Row label="Other Allowance" m={r.otherAllowance} />
                {r.track === 'sales' && r.variable > 0 && <Row label="Variable Pay (paid on target hit)" m={r.variable} italic />}
                {r.track === 'sales' && r.perfBonus > 0 && <Row label="Performance Bonus (annual, rating ≥ 4)" m={r.perfBonus} italic />}
                {r.track === 'sales' && r.travel > 0 && <Row label="Travel Allowance (reimburse on bills)" m={r.travel} italic />}
                <Section label={r.track === 'sales' ? 'Fixed Monthly Gross' : 'Gross Pay'} m={r.gross} />
                <Row label="Employee Contribution towards EPF" m={r.employeeEpf} />
                {r.isEsic && r.esicEe > 0 && <Row label="ESIC (Employee 0.75%)" m={r.esicEe} />}
                <Row label="P Tax" m={r.pt} />
                <tr><td colSpan={3} className="bg-amber-50 px-3 py-1.5 text-[10.5px] text-amber-800 italic">
                  ↳ Total employee deductions = EPF ₹{fmt(r.employeeEpf)} + PT ₹{fmt(r.pt)}{r.isEsic ? ` + ESIC ₹${fmt(r.esicEe)}` : ''} = <b>₹{fmt(totalDed)}</b>.
                  Net = {r.track === 'sales' ? 'Fixed Gross' : 'Gross'} − Deductions = {fmt(r.gross)} − {fmt(totalDed)} = <b>₹{fmt(r.net)}</b>
                </td></tr>
                <Section label={r.track === 'sales' ? 'Net Salary (Monthly Take-Home)' : 'Net Salary'} m={r.net} />
                {r.track === 'sales' && atRisk > 0 && (
                  <tr><td colSpan={3} className="bg-cyan-50 border-t-2 border-cyan-400 px-3 py-2 text-[10.5px] text-cyan-800">
                    <b>↳ At-Risk Pool (paid only on hit):</b> Variable ₹{fmt(r.variable)} + Bonus ₹{fmt(r.perfBonus)} + Travel ₹{fmt(r.travel)} = <b>₹{fmt(atRisk)}/mo</b>. On-Target Earnings = Fixed + At-Risk = <b>₹{fmt(onTargetGross)}/mo</b> if fully delivered.
                  </td></tr>
                )}
                <Row label="Employer's Contribution towards EPF" m={r.employerEpf} />
                {r.isEsic && r.esicEr > 0 && <Row label="Employer's ESIC (3.25%)" m={r.esicEr} />}
                {!r.isEsic && r.medical > 0 && <Row label="Health Insurance (Corporate Mediclaim)" m={r.medical} />}
                <Row label="Gratuity (4.81% of basic)" m={r.gratuity} />
                {r.statutoryBonus > 0 && (
                  <Row label="Statutory Bonus (8.33%, paid annually under PoB Act 1965)" m={r.statutoryBonus} />
                )}
                <tr><td colSpan={3} className="bg-emerald-50 px-3 py-1.5 text-[10px] text-emerald-800 italic">
                  ✓ CTC reconciles: Fixed Gross {fmt(r.gross)} + At-Risk {fmt(atRisk)} + Employer EPF {fmt(r.employerEpf)} + Gratuity {fmt(r.gratuity)}{r.statutoryBonus > 0 ? ` + Stat Bonus ${fmt(r.statutoryBonus)}` : ''}{r.isEsic ? ` + ESIC-Er ${fmt(r.esicEr)}` : ''}{!r.isEsic && r.medical > 0 ? ` + Mediclaim ${fmt(r.medical)}` : ''} = <b>₹{fmt(r.gross + atRisk + r.employerEpf + r.gratuity + r.esicEr + r.medical + r.statutoryBonus)}</b>
                </td></tr>
                <Section label="Cost to Company (CTC)" m={r.ctc} />
              </tbody>
            </table>

            {/* Compliance panel */}
            <div className="mt-4">
              {comp.errors.length === 0 && comp.warnings.length === 0 && (
                <CompCard tone="ok" head="Statutory Compliance: CLEAR" sub="All Indian labour-law checks passed — safe to publish offer letter." icon={<ShieldCheck className="w-4 h-4" />} findings={[]} />
              )}
              {comp.errors.length > 0 && (
                <CompCard
                  tone="err"
                  head={`${comp.errors.length} Statutory Violation${comp.errors.length > 1 ? 's' : ''} — Offer letter CANNOT be published`}
                  icon={<ShieldX className="w-4 h-4" />}
                  findings={comp.errors}
                />
              )}
              {comp.warnings.length > 0 && (
                <CompCard
                  tone="warn"
                  head={`${comp.warnings.length} Compliance Warning${comp.warnings.length > 1 ? 's' : ''} — Review before HR signoff`}
                  icon={<ShieldAlert className="w-4 h-4" />}
                  findings={comp.warnings}
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-extrabold mb-3">📋 Statutory Coverage Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11.5px]">
            {[
              ['Minimum Wages Act, 1948', 'Basic ≥ state-schedule skilled MW'],
              ['Code on Wages, 2019 — Sec 7', 'Basic ≥ 50% of total remuneration'],
              ['EPF & MP Act, 1952 — Para 26A', 'Form 11 opt-out validity (Basic > ₹15k + no prior PF)'],
              ['ESI Act, 1948 — Sec 2(9)', 'ESI mandatory if monthly wage ≤ ₹21k'],
              ['Payment of Bonus Act, 1965', 'Stat bonus 8.33–20% if Basic ≤ ₹21k'],
              ['Payment of Gratuity Act, 1972', '4.81% accrual on Basic'],
              ['Code on Social Security, 2020', 'Fixed-term gratuity from year-1'],
              ['IT Act 1961 — Sec 10(13A)', 'HRA exempt cap 50%/40% of Basic'],
              ['Finance Act 2018', 'Conveyance exemption withdrawn'],
              ['Constitution Art. 276(2)', 'PT ≤ ₹2,500/yr per person'],
              ['Code on Wages — judicial reading', 'Sustained variable may be re-classed as wages'],
              ['IT Act — Sec 192 vs 194J', 'Intern stipend TDS classification'],
            ].map(([law, check], i) => (
              <div key={i} className="flex items-start gap-2 border-l-2 border-sky-200 pl-2 py-1">
                <div>
                  <div className="font-bold text-slate-800">{law}</div>
                  <div className="text-slate-600">{check}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-700">
            <FileDown className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small helper components ─────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{children}</label>;
}

function TrackBtn({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} className={`px-3 py-3 rounded-lg border text-xs font-bold ${active ? 'bg-cyan-50 border-cyan-500 text-cyan-800' : 'bg-white border-slate-200 text-slate-600'}`}>
      <div>{title}</div>
      <div className="text-[9px] opacity-70 font-medium mt-0.5">{sub}</div>
    </button>
  );
}

function PfBtn({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2.5 rounded-lg border ${active ? 'bg-cyan-50 border-cyan-500' : 'bg-white border-slate-200'}`}>
      <div className={`text-xs font-bold ${active ? 'text-cyan-800' : 'text-slate-700'}`}>{title}</div>
      <div className="text-[10px] text-slate-600 leading-snug mt-0.5">{desc}</div>
    </button>
  );
}

function Pill({ color, children }: { color: 'gray' | 'red' | 'green'; children: React.ReactNode }) {
  const map = { gray: 'bg-slate-100 text-slate-700', red: 'bg-rose-100 text-rose-800', green: 'bg-emerald-100 text-emerald-800' };
  return <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${map[color]}`}>{children}</span>;
}

function Row({ label, m, italic }: { label: string; m: number; italic?: boolean }) {
  return (
    <tr className={italic ? 'italic text-slate-500' : ''}>
      <td className="px-3 py-1.5">{label}</td>
      <td className="text-right px-3 py-1.5 font-mono">{fmt(m)}</td>
      <td className="text-right px-3 py-1.5 font-mono text-slate-400">{fmt(m * 12)}</td>
    </tr>
  );
}

function Section({ label, m }: { label: string; m: number }) {
  return (
    <tr className="bg-sky-700 text-white font-bold">
      <td className="px-3 py-2">{label}</td>
      <td className="text-right px-3 py-2 font-mono">{fmt(m)}</td>
      <td className="text-right px-3 py-2 font-mono">{fmt(m * 12)}</td>
    </tr>
  );
}

function CompCard({ tone, head, sub, icon, findings }: { tone: 'ok' | 'warn' | 'err'; head: string; sub?: string; icon: React.ReactNode; findings: { code: string; message: string; citation: string }[] }) {
  const palette = {
    ok: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    warn: 'bg-amber-50 border-amber-300 text-amber-900',
    err: 'bg-rose-50 border-rose-300 text-rose-900',
  }[tone];
  return (
    <div className={`border rounded-lg p-3 mb-3 ${palette}`}>
      <div className="flex items-center gap-2 font-extrabold text-sm">{icon} {head}</div>
      {sub && <div className="text-xs opacity-80 mt-1">{sub}</div>}
      {findings.length > 0 && (
        <ul className="mt-2 space-y-2">
          {findings.map((f, i) => (
            <li key={i} className="text-[11.5px] leading-snug">
              <span className="font-extrabold tracking-wide">{f.code}</span> — {f.message}
              <div className="text-[10px] italic opacity-70 mt-0.5">{f.citation}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
