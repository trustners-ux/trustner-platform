'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  Wallet,
  Lightbulb,
  PiggyBank,
  Receipt,
  Calendar,
  Briefcase,
  Shield,
  Coins,
  MessageCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatINR } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER, COMPANY } from '@/lib/constants/company';
import NumberInput from '@/components/ui/NumberInput';
import DownloadPDFButton from '@/components/ui/DownloadPDFButton';
import PersonalInfoBar from '@/components/ui/PersonalInfoBar';

type OrgType =
  | 'Central PSU'
  | 'State PSU'
  | 'PSU Bank'
  | 'Government'
  | 'Large Corporate'
  | 'Other';

const ORG_OPTIONS: OrgType[] = [
  'Central PSU',
  'State PSU',
  'PSU Bank',
  'Government',
  'Large Corporate',
  'Other',
];

const STREAM_COLORS = {
  pf: '#0F766E',
  vpf: '#14B8A6',
  nps: '#6366F1',
  gratuity: '#D97706',
  leave: '#F59E0B',
  pension: '#7C3AED',
  insurance: '#EC4899',
  other: '#0EA5E9',
};

// -- Collapsible section wrapper ----------------------------------------
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  tone?: 'brand' | 'teal' | 'indigo' | 'amber' | 'orange' | 'purple' | 'pink' | 'sky';
  children: React.ReactNode;
  badge?: string;
}

const TONE_MAP: Record<NonNullable<SectionProps['tone']>, { border: string; bg: string; icon: string }> = {
  brand: { border: 'border-brand-200', bg: 'bg-brand-50/40', icon: 'text-brand-700' },
  teal: { border: 'border-teal-200', bg: 'bg-teal-50/40', icon: 'text-teal-700' },
  indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50/40', icon: 'text-indigo-700' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50/40', icon: 'text-amber-700' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50/40', icon: 'text-orange-700' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50/40', icon: 'text-purple-700' },
  pink: { border: 'border-pink-200', bg: 'bg-pink-50/40', icon: 'text-pink-700' },
  sky: { border: 'border-sky-200', bg: 'bg-sky-50/40', icon: 'text-sky-700' },
};

function Section({ title, icon, defaultOpen = false, tone = 'brand', children, badge }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const t = TONE_MAP[tone];
  return (
    <div className={cn('rounded-xl border transition-colors', t.border, open ? t.bg : 'bg-white')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn('shrink-0', t.icon)}>{icon}</span>
          <span className="text-sm font-bold text-primary-700 truncate">{title}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-surface-300 text-slate-500">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4 animate-in">{children}</div>}
    </div>
  );
}

// -- Toggle row ---------------------------------------------------------
function ToggleRow({
  label,
  enabled,
  onChange,
  color = 'bg-brand-500',
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? color : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// -- Compound an annual contribution stream -----------------------------
// Contributions are made throughout year y (1..N); salary for that year grows at g.
// Contributions are compounded to retirement at rate r.
function futureValueOfContributions(
  yearlyContribution: (yearIndex: number) => number, // 1..N
  totalYears: number,
  rate: number, // decimal
  startingCorpus: number
): { fv: number; schedule: { year: number; contribution: number; corpus: number }[] } {
  let corpus = startingCorpus;
  const schedule: { year: number; contribution: number; corpus: number }[] = [];
  for (let y = 1; y <= totalYears; y++) {
    const contribution = yearlyContribution(y);
    // Grow existing corpus for the year, and add contribution (treated end-of-year simplification)
    corpus = corpus * (1 + rate) + contribution;
    schedule.push({ year: y, contribution, corpus });
  }
  return { fv: corpus, schedule };
}

// -- Government / PSU tax regime detection -----------------------------
// Government employees & most Central PSUs fall under Sec 10(10)(i)/10(10AA)(i)
// — gratuity and leave encashment are FULLY tax-free (no caps).
// Private/corporate employees (non-govt) are capped under Sec 10(10)(iii) / 10(10AA)(ii):
// gratuity ≤ ₹20L tax-free; leave encashment ≤ ₹25L tax-free.
function isGovtLikeEmployer(org: OrgType): boolean {
  return org === 'Government' || org === 'Central PSU' || org === 'State PSU' || org === 'PSU Bank';
}

// -- Pension commutation factor lookup (CCS Commutation Rules) ---------
// Government pension commutation value depends on the "next birthday" age.
// Standard CCS commutation factor table (selected ages):
//   55 → 10.46, 58 → 10.13, 60 → 9.81, 62 → 9.48, 65 → 9.15,
//   67 → 8.93, 70 → 8.64 (approximate interpolation from official table).
function commutationFactor(retireAge: number): number {
  const table: { age: number; f: number }[] = [
    { age: 50, f: 11.10 },
    { age: 55, f: 10.46 },
    { age: 58, f: 10.13 },
    { age: 60, f: 9.81 },
    { age: 62, f: 9.48 },
    { age: 65, f: 9.15 },
    { age: 67, f: 8.93 },
    { age: 70, f: 8.64 },
  ];
  if (retireAge <= table[0].age) return table[0].f;
  if (retireAge >= table[table.length - 1].age) return table[table.length - 1].f;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (retireAge >= a.age && retireAge <= b.age) {
      const frac = (retireAge - a.age) / (b.age - a.age);
      return a.f + (b.f - a.f) * frac;
    }
  }
  return 9.81;
}

export default function PSUBenefitsCalculatorPage() {
  // ── Section 1: Personal & Service ──────────────────────────────────
  const [clientName, setClientName] = useState('');
  const [currentAge, setCurrentAge] = useState<number | null>(40);
  const [retirementAge, setRetirementAge] = useState(60);
  const [orgType, setOrgType] = useState<OrgType>('Central PSU');
  const [monthlyBasic, setMonthlyBasic] = useState(60000);
  // Dearness Allowance as % of Basic. Typical PSU/Govt values sit at 40-55% in 2026.
  // DA is counted toward PF-eligible wage, gratuity, and leave encashment — material impact.
  const [daPercent, setDaPercent] = useState(50);
  const [salaryGrowth, setSalaryGrowth] = useState(7);
  const [currentServiceYears, setCurrentServiceYears] = useState(10);

  // ── Section 2: EPF ─────────────────────────────────────────────────
  const [pfCorpus, setPfCorpus] = useState(500000);
  const employeePfRate = 12; // statutory, display-only
  const [employerPfRate, setEmployerPfRate] = useState(3.67);
  const [pfReturn, setPfReturn] = useState(8.25);

  // ── Section 3: VPF ─────────────────────────────────────────────────
  const [hasVpf, setHasVpf] = useState(false);
  const [vpfRate, setVpfRate] = useState(10);
  const [vpfStartYear, setVpfStartYear] = useState(1);

  // ── Section 4: NPS ─────────────────────────────────────────────────
  const [hasNps, setHasNps] = useState(false);
  const [npsCorpus, setNpsCorpus] = useState(0);
  const [monthlyNps, setMonthlyNps] = useState(5000);
  const [npsReturn, setNpsReturn] = useState(10);
  const [annuityPct, setAnnuityPct] = useState(40);
  const [annuityRate, setAnnuityRate] = useState(6);

  // ── Section 6: Leave Encashment ────────────────────────────────────
  const [leaveBalance, setLeaveBalance] = useState(300);
  const [annualLeaveAccrual, setAnnualLeaveAccrual] = useState(30);

  // ── Section 7: Pension ─────────────────────────────────────────────
  const [hasPension, setHasPension] = useState(false);
  const [monthlyPension, setMonthlyPension] = useState(25000);
  const [commutePension, setCommutePension] = useState(false);

  // ── Section 8: Insurance ───────────────────────────────────────────
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insurancePremiumPerYear, setInsurancePremiumPerYear] = useState(50000);
  const [insurancePremiumsPaid, setInsurancePremiumsPaid] = useState(500000);
  const [insuranceMaturityValue, setInsuranceMaturityValue] = useState(1500000);
  const [insuranceMaturityYear, setInsuranceMaturityYear] = useState(new Date().getFullYear() + 15);

  // ── Section 9: Other ──────────────────────────────────────────────
  const [hasOther, setHasOther] = useState(false);
  const [pliAmount, setPliAmount] = useState(0);
  const [superannuationCorpus, setSuperannuationCorpus] = useState(0);
  const [cpseEtfHoldings, setCpseEtfHoldings] = useState(0);

  // ── Desired post-retirement income (for supplement SIP) ────────────
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(80000);

  // ─────────────────────────────────────────────────────────────────────
  // CORE CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────
  const safeCurrentAge = currentAge ?? 40;
  const yearsToRetire = Math.max(0, retirementAge - safeCurrentAge);
  const todaysYear = new Date().getFullYear();

  const result = useMemo(() => {
    const g = salaryGrowth / 100;
    const pfR = pfReturn / 100;
    const npsR = npsReturn / 100;
    const govtLike = isGovtLikeEmployer(orgType);

    // Salary projection — basic at year y (1..N) = current * (1+g)^(y-1)
    const basicAtYear = (y: number) => monthlyBasic * Math.pow(1 + g, y - 1);

    // PF-eligible wage = Basic + DA (critical for PSU/Govt).
    // Gratuity, leave encashment, and PF contributions all use this combined wage.
    const pfWageAtYear = (y: number) => basicAtYear(y) * (1 + daPercent / 100);

    // --- PF (EPF) ---
    const pfContribution = (y: number) => {
      const wage = pfWageAtYear(y);
      return wage * ((employeePfRate + employerPfRate) / 100) * 12;
    };
    const pfRes = futureValueOfContributions(pfContribution, yearsToRetire, pfR, pfCorpus);

    // --- VPF ---
    const vpfContribution = (y: number) => {
      if (!hasVpf || y < vpfStartYear) return 0;
      const wage = pfWageAtYear(y);
      return wage * (vpfRate / 100) * 12;
    };
    const vpfRes = futureValueOfContributions(vpfContribution, yearsToRetire, pfR, 0);

    // --- NPS ---
    const npsContribution = (y: number) => {
      if (!hasNps) return 0;
      // Grow NPS contribution with salary growth too (common assumption)
      return monthlyNps * 12 * Math.pow(1 + g, y - 1);
    };
    const npsRes = futureValueOfContributions(
      npsContribution,
      yearsToRetire,
      npsR,
      hasNps ? npsCorpus : 0
    );

    const npsLumpSum = npsRes.fv * (1 - annuityPct / 100);
    const npsAnnuityCorpus = npsRes.fv * (annuityPct / 100);
    const npsMonthlyAnnuity = hasNps ? (npsAnnuityCorpus * (annuityRate / 100)) / 12 : 0;

    // --- Gratuity ---
    // Formula: (Last drawn Basic+DA × 15 × years of service) / 26.
    // For government / PSU employees (Sec 10(10)(i)) gratuity is FULLY tax-free — no cap.
    // For private/corporate employees (Sec 10(10)(iii)) the cap is ₹20L for tax exemption.
    // The *actual* gratuity paid by govt/PSU employers is also subject to an internal ceiling
    // (currently ₹25L for central govt per 7th CPC), but we display the gross amount and flag
    // the tax-free portion below.
    const lastBasic = basicAtYear(Math.max(1, yearsToRetire));
    const lastPfWage = pfWageAtYear(Math.max(1, yearsToRetire));
    const totalServiceYears = yearsToRetire + currentServiceYears;
    const gratuityRaw = (lastPfWage * 15 * totalServiceYears) / 26;
    const gratuity = govtLike ? gratuityRaw : Math.min(2000000, gratuityRaw);

    // --- Leave Encashment ---
    // Uses (Basic + DA) × leave days / 30. Projected leave balance capped at 300 (typical PSU).
    // For govt/PSU (Sec 10(10AA)(i)) — fully tax-free.
    // For private/corporate (Sec 10(10AA)(ii)) — tax-free up to ₹25L (raised in Budget 2023).
    const projectedLeaveBalance = Math.min(300, leaveBalance + annualLeaveAccrual * yearsToRetire);
    const leaveEncashment = (lastPfWage * projectedLeaveBalance) / 30;

    // --- Pension (pre-2004 joiners / defined benefit) ---
    // Commutation factor varies with retirement age per CCS Commutation Rules.
    // The commuted portion is RESTORED to the pensioner 15 years after the commutation date.
    let pensionCommutedLumpSum = 0;
    let reducedMonthlyPension = monthlyPension;
    const commFactor = commutationFactor(retirementAge);
    if (hasPension && commutePension) {
      pensionCommutedLumpSum = 0.4 * monthlyPension * 12 * commFactor;
      reducedMonthlyPension = monthlyPension * 0.6;
    }
    const totalPensionAmount = hasPension ? pensionCommutedLumpSum : 0;

    // --- Insurance Maturity ---
    let insuranceAtRetirement = 0;
    let insuranceAgeAtMaturity = 0;
    if (hasInsurance) {
      const yearsToMaturity = insuranceMaturityYear - todaysYear;
      insuranceAgeAtMaturity = safeCurrentAge + yearsToMaturity;
      if (insuranceMaturityYear <= todaysYear + yearsToRetire) {
        insuranceAtRetirement = insuranceMaturityValue;
      }
    }

    // --- Other benefits ---
    const otherTotal = hasOther ? pliAmount + superannuationCorpus + cpseEtfHoldings : 0;

    // --- Total Corpus (lump sums only, excluding monthly annuity/pension streams) ---
    const lumpSumCorpus =
      pfRes.fv +
      vpfRes.fv +
      npsLumpSum +
      gratuity +
      leaveEncashment +
      totalPensionAmount +
      insuranceAtRetirement +
      otherTotal;

    // --- Post-retirement monthly cashflow ---
    // SWP-worthy income from a conservative slice (use SWP on lump-sum corpus @6%)
    const swpAnnualRate = 6;
    const monthlySwp = (lumpSumCorpus * swpAnnualRate) / 100 / 12;
    const totalMonthlyIncome =
      npsMonthlyAnnuity + (hasPension ? reducedMonthlyPension : 0) + monthlySwp;

    // --- Tax-free vs taxable breakdown ---
    // Sections 10(10) [gratuity], 10(10AA) [leave], 10(12) [PF], 10(12A)/(12B) [NPS lump & partial],
    // 10(10A) [commuted pension]. Govt/PSU employees get the fully-exempt variants; private
    // employees fall under the capped variants.
    const taxFreeGratuity = govtLike ? gratuity : Math.min(gratuity, 2000000);
    const taxFreeLeave = govtLike ? leaveEncashment : Math.min(leaveEncashment, 2500000);
    const taxFreeNps = npsLumpSum; // 60% lump is tax-free under Sec 10(12A)
    const taxFreePf = pfRes.fv + vpfRes.fv; // EPF fully tax-free if held >5 yrs
    // Commuted pension: 100% tax-free for govt employees (Sec 10(10A)(i)); for non-govt the
    // formula is 1/3 if gratuity received else 1/2 — approximate by 1/3 exempt for private.
    const taxFreePension = govtLike ? totalPensionAmount : totalPensionAmount / 3;
    const taxFreeTotal =
      taxFreePf + taxFreeNps + taxFreeGratuity + taxFreeLeave + taxFreePension;
    const taxableTotal = Math.max(0, lumpSumCorpus - taxFreeTotal);

    // --- Corpus build-up chart (year-by-year running total) ---
    const chartData: {
      year: number;
      age: number;
      basic: number;
      pf: number;
      vpf: number;
      nps: number;
      running: number;
    }[] = [];
    for (let y = 1; y <= yearsToRetire; y++) {
      const pfC = pfRes.schedule[y - 1]?.corpus ?? 0;
      const vpfC = vpfRes.schedule[y - 1]?.corpus ?? 0;
      const npsC = npsRes.schedule[y - 1]?.corpus ?? 0;
      chartData.push({
        year: y,
        age: safeCurrentAge + y,
        basic: Math.round(basicAtYear(y)),
        pf: Math.round(pfC),
        vpf: Math.round(vpfC),
        nps: Math.round(npsC),
        running: Math.round(pfC + vpfC + npsC),
      });
    }

    // --- Inflation-adjusted purchasing power at 60/65/70 vs today ---
    const inflation = 0.06;
    const realAt = (targetAge: number) => {
      const yrs = Math.max(0, targetAge - safeCurrentAge);
      const nominal = totalMonthlyIncome;
      return nominal / Math.pow(1 + inflation, yrs);
    };

    return {
      // FV streams
      pfFV: pfRes.fv,
      vpfFV: vpfRes.fv,
      npsFV: npsRes.fv,
      npsLumpSum,
      npsMonthlyAnnuity,
      npsAnnuityCorpus,
      gratuity,
      gratuityRaw,
      leaveEncashment,
      projectedLeaveBalance,
      totalPensionAmount,
      reducedMonthlyPension,
      pensionCommutedLumpSum,
      commFactor,
      insuranceAtRetirement,
      insuranceAgeAtMaturity,
      otherTotal,

      // derived
      govtLike,
      lastPfWage,

      // totals
      lumpSumCorpus,
      totalMonthlyIncome,
      monthlySwp,

      // tax
      taxFreeTotal,
      taxableTotal,
      taxFreePf,
      taxFreeNps,
      taxFreeGratuity,
      taxFreeLeave,
      taxFreePension,

      // helpers
      lastBasic,
      totalServiceYears,

      // chart
      chartData,

      // purchasing power
      realAt60: realAt(60),
      realAt65: realAt(65),
      realAt70: realAt(70),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safeCurrentAge,
    retirementAge,
    orgType,
    yearsToRetire,
    monthlyBasic,
    daPercent,
    salaryGrowth,
    currentServiceYears,
    pfCorpus,
    employerPfRate,
    pfReturn,
    hasVpf,
    vpfRate,
    vpfStartYear,
    hasNps,
    npsCorpus,
    monthlyNps,
    npsReturn,
    annuityPct,
    annuityRate,
    leaveBalance,
    annualLeaveAccrual,
    hasPension,
    monthlyPension,
    commutePension,
    hasInsurance,
    insurancePremiumPerYear,
    insurancePremiumsPaid,
    insuranceMaturityValue,
    insuranceMaturityYear,
    hasOther,
    pliAmount,
    superannuationCorpus,
    cpseEtfHoldings,
  ]);

  // --- Supplement SIP calculation ---
  const supplementSIP = useMemo(() => {
    // Desired corpus = desiredMonthlyIncome × 12 × 25 × inflation factor (today -> retirement @6%)
    const yrsRetire = yearsToRetire;
    const inflation = 0.06;
    const futureMonthlyIncomeNeed = desiredMonthlyIncome * Math.pow(1 + inflation, yrsRetire);
    const desiredCorpus = futureMonthlyIncomeNeed * 12 * 25;
    const shortfall = Math.max(0, desiredCorpus - result.lumpSumCorpus);
    // SIP @12% for yrsRetire years
    const monthlyRate = 0.12 / 12;
    const n = yrsRetire * 12;
    const fvFactor = n > 0 ? ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate) : 0;
    const monthlySip = fvFactor > 0 ? shortfall / fvFactor : 0;
    return {
      desiredCorpus,
      shortfall,
      monthlySip,
      futureMonthlyIncomeNeed,
    };
  }, [desiredMonthlyIncome, yearsToRetire, result.lumpSumCorpus]);

  // --- Pie data for breakdown ---
  const pieData = [
    { name: 'EPF', value: Math.round(result.pfFV), color: STREAM_COLORS.pf },
    ...(hasVpf ? [{ name: 'VPF', value: Math.round(result.vpfFV), color: STREAM_COLORS.vpf }] : []),
    ...(hasNps
      ? [{ name: 'NPS Lump Sum', value: Math.round(result.npsLumpSum), color: STREAM_COLORS.nps }]
      : []),
    { name: 'Gratuity', value: Math.round(result.gratuity), color: STREAM_COLORS.gratuity },
    {
      name: 'Leave Encashment',
      value: Math.round(result.leaveEncashment),
      color: STREAM_COLORS.leave,
    },
    ...(hasPension && commutePension
      ? [
          {
            name: 'Commuted Pension',
            value: Math.round(result.pensionCommutedLumpSum),
            color: STREAM_COLORS.pension,
          },
        ]
      : []),
    ...(hasInsurance && result.insuranceAtRetirement > 0
      ? [
          {
            name: 'Insurance Maturity',
            value: Math.round(result.insuranceAtRetirement),
            color: STREAM_COLORS.insurance,
          },
        ]
      : []),
    ...(hasOther && result.otherTotal > 0
      ? [{ name: 'Other', value: Math.round(result.otherTotal), color: STREAM_COLORS.other }]
      : []),
  ].filter((d) => d.value > 0);

  // --- Insights ---
  const insights = useMemo(() => {
    const items: { text: string; tone: 'good' | 'warn' | 'info' }[] = [];
    const corpus = result.lumpSumCorpus;

    if (corpus >= 30000000) {
      items.push({
        text: `Strong corpus of ${formatINR(corpus)} — focus now on a tax-efficient withdrawal sequence and estate planning. A Growth-option mutual fund SWP can ease the income need while letting the balance keep compounding.`,
        tone: 'good',
      });
    } else if (corpus >= 10000000) {
      items.push({
        text: `Moderate corpus of ${formatINR(corpus)} — consider top-up SIPs in equity mutual funds to bridge the gap between corpus income and lifestyle expectations.`,
        tone: 'info',
      });
    } else {
      items.push({
        text: `Projected corpus of ${formatINR(corpus)} is likely short of a comfortable retirement at today's living standards. Start a supplementary equity mutual fund SIP now — even small amounts compound meaningfully over ${yearsToRetire} years.`,
        tone: 'warn',
      });
    }

    if (hasNps && hasVpf) {
      if (npsReturn > pfReturn + 1) {
        items.push({
          text: `Your NPS is assumed to earn ${npsReturn}% vs VPF at ${pfReturn}%. For the long horizon (${yearsToRetire} yrs), keeping NPS allocation aggressive on the equity side typically beats topping up VPF beyond the ₹2.5L tax-free interest limit.`,
          tone: 'info',
        });
      }
    } else if (hasVpf && !hasNps) {
      items.push({
        text: `You are using VPF but not NPS. NPS adds Section 80CCD(1B) ₹50,000 extra deduction plus equity exposure — worth evaluating for long-horizon growth.`,
        tone: 'info',
      });
    } else if (!hasVpf && !hasNps) {
      items.push({
        text: `You are relying only on statutory EPF. Even a small VPF or NPS allocation of 5-10% of basic can materially lift your retirement corpus.`,
        tone: 'info',
      });
    }

    if (result.gratuityRaw > 2000000 && !result.govtLike) {
      items.push({
        text: `Calculated gratuity is ${formatINR(result.gratuityRaw)}, but only ₹20 lakh is tax-free under Sec 10(10)(iii) for non-government employees. The ${formatINR(result.gratuityRaw - 2000000)} excess will be taxable — plan to invest it tax-efficiently.`,
        tone: 'warn',
      });
    } else if (result.gratuityRaw > 2000000 && result.govtLike) {
      items.push({
        text: `Your projected gratuity is ${formatINR(result.gratuityRaw)} — fully tax-free under Sec 10(10)(i) for Government / PSU employees (no ceiling). This is a significant lump sum; deploy it into a disciplined mutual fund mix via your Relationship Manager to preserve purchasing power.`,
        tone: 'good',
      });
    }

    // NPS annuity taxability note
    if (hasNps && result.npsMonthlyAnnuity > 0) {
      items.push({
        text: `Your NPS annuity of ${formatINR(result.npsMonthlyAnnuity)}/month is taxable as "income from other sources" at your applicable slab rate. The 60% lump sum remains tax-free. Consider your post-retirement slab before fixing the annuity percentage.`,
        tone: 'info',
      });
    }

    // DA missing warning
    if (daPercent === 0) {
      items.push({
        text: `Your DA is set to 0%. For most PSU/Govt employees DA is 40-55% of basic and is counted for PF, gratuity and leave encashment. If you're a PSU employee, update DA to see an accurate corpus projection.`,
        tone: 'warn',
      });
    }

    if (result.totalMonthlyIncome > 0) {
      items.push({
        text: `Post-retirement monthly income projection: ${formatINR(result.totalMonthlyIncome)} (nominal). Real purchasing power at age 70 erodes to ${formatINR(result.realAt70)} in today's terms at 6% inflation — build an inflation-beating allocation via mutual funds.`,
        tone: 'info',
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, hasNps, hasVpf, npsReturn, pfReturn, yearsToRetire]);

  const nameOrYour = clientName || 'Your';

  const whatsappLink = `https://wa.me/916003903737?text=${encodeURIComponent(
    `Hi Trustner team, I just used the PSU Retirement Benefits Calculator on MeraSIP. My projected corpus is ${formatINR(result.lumpSumCorpus)} and I'd like to speak with my Relationship Manager about supplementing it with mutual fund SIPs.`
  )}`;

  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Calculators
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Landmark className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">
                For PSU, Government &amp; Corporate Employees
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">PSU Retirement Benefits Planner</h1>
              <p className="text-slate-300 mt-1 max-w-2xl">
                Project your total retirement corpus across PF, VPF, Gratuity, Leave Encashment,
                Pension, and more &mdash; specifically designed for PSU, Government, and Large
                Corporate employees.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div id="calculator-results" className="grid lg:grid-cols-[420px_1fr] gap-8">
            {/* ─────────────────────── INPUT PANEL ─────────────────────── */}
            <div className="card-base p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <h2 className="font-bold text-primary-700 mb-4 text-lg">Your Benefits Profile</h2>

              <PersonalInfoBar
                name={clientName}
                onNameChange={setClientName}
                age={currentAge}
                onAgeChange={setCurrentAge}
                namePlaceholder="e.g., Ramesh"
                ageLabel="Current Age"
              />

              {/* Section 1: always expanded */}
              <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 mb-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-700" />
                  <span className="text-sm font-bold text-primary-700">Personal &amp; Service Details</span>
                </div>
                <NumberInput
                  label="Retirement Age"
                  value={retirementAge}
                  onChange={setRetirementAge}
                  suffix="years"
                  step={1}
                  min={55}
                  max={70}
                  hint="PSU default is 60; some roles extend up to 65-70"
                />

                {/* Org type dropdown */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                    Organization Type
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrgType)}
                    className="w-full py-3 px-3 text-sm font-semibold text-primary-700 bg-white border border-surface-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  >
                    {ORG_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <NumberInput
                  label="Current Monthly Basic Salary"
                  value={monthlyBasic}
                  onChange={setMonthlyBasic}
                  prefix="₹"
                  step={5000}
                  min={10000}
                  max={5000000}
                  hint="Drives gratuity, leave encashment &amp; PF contributions"
                />
                <NumberInput
                  label="Dearness Allowance (DA)"
                  value={daPercent}
                  onChange={setDaPercent}
                  suffix="% of Basic"
                  step={1}
                  min={0}
                  max={200}
                  hint="PSU/Govt: typically 40-55% in 2026. DA counts toward PF, gratuity &amp; leave encashment."
                />
                <div className="text-[11px] text-slate-500 bg-white/70 rounded-lg px-3 py-2">
                  Current PF-eligible wage (Basic + DA):{' '}
                  <span className="font-bold text-primary-700">
                    ₹{Math.round(monthlyBasic * (1 + daPercent / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <NumberInput
                  label="Expected Annual Salary Growth"
                  value={salaryGrowth}
                  onChange={setSalaryGrowth}
                  suffix="% p.a."
                  step={0.5}
                  min={0}
                  max={15}
                />
                <NumberInput
                  label="Current Years of Service Completed"
                  value={currentServiceYears}
                  onChange={setCurrentServiceYears}
                  suffix="years"
                  step={1}
                  min={0}
                  max={40}
                />
                <div className="text-[11px] text-slate-500 bg-white/70 rounded-lg px-3 py-2">
                  Total service at retirement:{' '}
                  <span className="font-bold text-primary-700">
                    {result.totalServiceYears} years
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Section 2: EPF */}
                <Section
                  title="EPF (Provident Fund)"
                  icon={<PiggyBank className="w-4 h-4" />}
                  defaultOpen
                  tone="teal"
                >
                  <NumberInput
                    label="Current PF Corpus"
                    value={pfCorpus}
                    onChange={setPfCorpus}
                    prefix="₹"
                    step={50000}
                    min={0}
                    max={50000000}
                  />
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                      Employee Contribution
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-3 px-3 text-sm font-bold text-slate-600 bg-slate-100 border border-surface-300 rounded-xl">
                        12% of basic
                      </div>
                      <span className="text-[10px] text-slate-400">Statutory</span>
                    </div>
                  </div>
                  <NumberInput
                    label="Employer Contribution to EPF"
                    value={employerPfRate}
                    onChange={setEmployerPfRate}
                    suffix="% of basic"
                    step={0.1}
                    min={0}
                    max={12}
                    hint="Default 3.67% (the rest goes to EPS)"
                  />
                  <NumberInput
                    label="Expected PF Return Rate"
                    value={pfReturn}
                    onChange={setPfReturn}
                    suffix="% p.a."
                    step={0.25}
                    min={6}
                    max={10}
                    hint="EPFO has declared 8.25% for FY25 — matches historical 5-yr average"
                  />
                </Section>

                {/* Section 3: VPF */}
                <Section
                  title="VPF (Voluntary PF)"
                  icon={<Coins className="w-4 h-4" />}
                  tone="indigo"
                  badge={hasVpf ? 'ON' : 'OFF'}
                >
                  <ToggleRow
                    label="Enable VPF contributions"
                    enabled={hasVpf}
                    onChange={setHasVpf}
                    color="bg-indigo-500"
                  />
                  {hasVpf && (
                    <>
                      <NumberInput
                        label="Additional Employee Contribution"
                        value={vpfRate}
                        onChange={setVpfRate}
                        suffix="% of basic"
                        step={1}
                        min={1}
                        max={88}
                        hint="On top of the statutory 12% EPF"
                      />
                      <NumberInput
                        label="Starting Year"
                        value={vpfStartYear}
                        onChange={setVpfStartYear}
                        suffix={`of ${yearsToRetire}y`}
                        step={1}
                        min={1}
                        max={Math.max(1, yearsToRetire)}
                        hint="Year (from now) when VPF contributions begin"
                      />
                      <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Note: VPF earns the same rate as EPF, but interest on contributions above ₹2.5
                        lakh/year becomes taxable (Budget 2021).
                      </div>
                    </>
                  )}
                </Section>

                {/* Section 4: NPS */}
                <Section
                  title="NPS (National Pension System)"
                  icon={<Shield className="w-4 h-4" />}
                  tone="purple"
                  badge={hasNps ? 'ON' : 'OFF'}
                >
                  <ToggleRow
                    label="Enable NPS"
                    enabled={hasNps}
                    onChange={setHasNps}
                    color="bg-purple-500"
                  />
                  {hasNps && (
                    <>
                      <NumberInput
                        label="Current NPS Corpus"
                        value={npsCorpus}
                        onChange={setNpsCorpus}
                        prefix="₹"
                        step={50000}
                        min={0}
                        max={50000000}
                      />
                      <NumberInput
                        label="Monthly NPS Contribution"
                        value={monthlyNps}
                        onChange={setMonthlyNps}
                        prefix="₹"
                        step={1000}
                        min={500}
                        max={200000}
                      />
                      <NumberInput
                        label="Expected NPS Return"
                        value={npsReturn}
                        onChange={setNpsReturn}
                        suffix="% p.a."
                        step={0.5}
                        min={6}
                        max={15}
                        hint="Balanced E-C-G allocation typically delivers ~10%"
                      />
                      <NumberInput
                        label="Annuity Purchase % at 60"
                        value={annuityPct}
                        onChange={setAnnuityPct}
                        suffix="%"
                        step={5}
                        min={40}
                        max={100}
                        hint="Minimum 40% mandatory per PFRDA rules"
                      />
                      <NumberInput
                        label="Expected Annuity Rate"
                        value={annuityRate}
                        onChange={setAnnuityRate}
                        suffix="% p.a."
                        step={0.25}
                        min={4}
                        max={10}
                      />
                    </>
                  )}
                </Section>

                {/* Section 5: Gratuity (auto) */}
                <Section
                  title="Gratuity (auto-calculated)"
                  icon={<Receipt className="w-4 h-4" />}
                  tone="amber"
                  defaultOpen
                >
                  <div className="bg-white rounded-lg border border-amber-200 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last drawn Basic + DA (projected)</span>
                      <span className="font-semibold text-primary-700">
                        {formatINR(result.lastPfWage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total service years</span>
                      <span className="font-semibold text-primary-700">
                        {result.totalServiceYears}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Formula ((Basic+DA) × 15 × yrs / 26)</span>
                      <span className="font-semibold text-slate-700">
                        {formatINR(result.gratuityRaw)}
                      </span>
                    </div>
                    <div className="h-px bg-amber-200 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-primary-700">
                        {result.govtLike ? 'Gratuity (uncapped)' : 'After ₹20L cap'}
                      </span>
                      <span className="font-extrabold text-amber-700">
                        {formatINR(result.gratuity)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {result.govtLike ? (
                      <>
                        <strong>Fully tax-free</strong> under Section 10(10)(i) — no ceiling for
                        Government / Central PSU / State PSU / PSU Bank employees.
                      </>
                    ) : (
                      <>
                        Tax-free up to <strong>₹20 lakh</strong> under Section 10(10)(iii) for
                        non-government employees. Any excess over ₹20L is taxable.
                      </>
                    )}
                  </div>
                </Section>

                {/* Section 6: Leave Encashment */}
                <Section
                  title="Leave Encashment"
                  icon={<Calendar className="w-4 h-4" />}
                  tone="orange"
                >
                  <NumberInput
                    label="Current Accumulated Leave Balance"
                    value={leaveBalance}
                    onChange={setLeaveBalance}
                    suffix="days"
                    step={10}
                    min={0}
                    max={300}
                    hint="Typical PSU max is 300 days"
                  />
                  <NumberInput
                    label="Expected Annual Leave Accrual"
                    value={annualLeaveAccrual}
                    onChange={setAnnualLeaveAccrual}
                    suffix="days/year"
                    step={5}
                    min={0}
                    max={60}
                  />
                  <div className="bg-white rounded-lg border border-orange-200 p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projected leave days at retirement</span>
                      <span className="font-semibold text-primary-700">
                        {result.projectedLeaveBalance} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Encashment ((Basic+DA) × days / 30)</span>
                      <span className="font-extrabold text-orange-700">
                        {formatINR(result.leaveEncashment)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {result.govtLike ? (
                      <>
                        <strong>Fully tax-free</strong> for Government / Central PSU / State PSU /
                        PSU Bank employees under Section 10(10AA)(i).
                      </>
                    ) : (
                      <>
                        Tax-free up to <strong>₹25 lakh</strong> for non-government employees
                        (Sec 10(10AA)(ii), Budget 2023). Excess is taxable.
                      </>
                    )}
                  </div>
                </Section>

                {/* Section 7: Pension */}
                <Section
                  title="Defined Benefit Pension"
                  icon={<Wallet className="w-4 h-4" />}
                  tone="pink"
                  badge={hasPension ? 'ELIGIBLE' : 'NA'}
                >
                  <ToggleRow
                    label="Eligible for PSU pension (pre-2004 joiner)"
                    enabled={hasPension}
                    onChange={setHasPension}
                    color="bg-pink-500"
                  />
                  {hasPension && (
                    <>
                      <NumberInput
                        label="Expected Monthly Pension"
                        value={monthlyPension}
                        onChange={setMonthlyPension}
                        prefix="₹"
                        step={1000}
                        min={0}
                        max={200000}
                      />
                      <ToggleRow
                        label="Commute 40% as lump sum"
                        enabled={commutePension}
                        onChange={setCommutePension}
                        color="bg-pink-500"
                      />
                      {commutePension && (
                        <div className="bg-white rounded-lg border border-pink-200 p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Commutation factor (age {retirementAge})
                            </span>
                            <span className="font-semibold text-slate-700">
                              {result.commFactor.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Commuted lump sum</span>
                            <span className="font-extrabold text-pink-700">
                              {formatINR(result.pensionCommutedLumpSum)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Reduced monthly pension (15y)</span>
                            <span className="font-semibold text-primary-700">
                              {formatINR(result.reducedMonthlyPension)}
                            </span>
                          </div>
                        </div>
                      )}
                      {commutePension && (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 space-y-1">
                          <div>
                            <strong>Commuted portion restores after 15 years</strong> from the date
                            of commutation. Your pension returns to full value at age {retirementAge + 15}.
                          </div>
                          <div>
                            Commuted value is fully tax-free for Government employees under
                            Sec 10(10A)(i); for non-government, only 1/3 (if gratuity received) or
                            1/2 (otherwise) is exempt.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Section>

                {/* Section 8: Insurance */}
                <Section
                  title="Existing Insurance Policies"
                  icon={<Shield className="w-4 h-4" />}
                  tone="sky"
                  badge={hasInsurance ? 'ON' : 'OFF'}
                >
                  <ToggleRow
                    label="Include LIC / traditional policy"
                    enabled={hasInsurance}
                    onChange={setHasInsurance}
                    color="bg-sky-500"
                  />
                  {hasInsurance && (
                    <>
                      <NumberInput
                        label="Annual Premium"
                        value={insurancePremiumPerYear}
                        onChange={setInsurancePremiumPerYear}
                        prefix="₹"
                        step={5000}
                        min={0}
                        max={1000000}
                      />
                      <NumberInput
                        label="Total Premiums Paid So Far"
                        value={insurancePremiumsPaid}
                        onChange={setInsurancePremiumsPaid}
                        prefix="₹"
                        step={10000}
                        min={0}
                        max={10000000}
                      />
                      <NumberInput
                        label="Expected Maturity Value"
                        value={insuranceMaturityValue}
                        onChange={setInsuranceMaturityValue}
                        prefix="₹"
                        step={100000}
                        min={0}
                        max={50000000}
                      />
                      <NumberInput
                        label="Year of Maturity"
                        value={insuranceMaturityYear}
                        onChange={setInsuranceMaturityYear}
                        suffix={`(age ${result.insuranceAgeAtMaturity || '-'})`}
                        step={1}
                        min={todaysYear}
                        max={todaysYear + 50}
                      />
                      <div className="text-[11px] text-slate-500 bg-white/70 rounded-lg px-3 py-2">
                        {result.insuranceAtRetirement > 0
                          ? `Maturity value of ${formatINR(result.insuranceAtRetirement)} will be added to your retirement corpus.`
                          : 'Maturity is after retirement — not added to retirement corpus.'}
                      </div>
                    </>
                  )}
                </Section>

                {/* Section 9: Other */}
                <Section
                  title="Other Benefits"
                  icon={<TrendingUp className="w-4 h-4" />}
                  tone="brand"
                  badge={hasOther ? 'ON' : 'OFF'}
                >
                  <ToggleRow
                    label="Include other retirement benefits"
                    enabled={hasOther}
                    onChange={setHasOther}
                    color="bg-brand-500"
                  />
                  {hasOther && (
                    <>
                      <NumberInput
                        label="Post-Retirement Medical Benefit (PLI)"
                        value={pliAmount}
                        onChange={setPliAmount}
                        prefix="₹"
                        step={50000}
                        min={0}
                        max={10000000}
                      />
                      <NumberInput
                        label="Superannuation Fund Corpus"
                        value={superannuationCorpus}
                        onChange={setSuperannuationCorpus}
                        prefix="₹"
                        step={50000}
                        min={0}
                        max={50000000}
                      />
                      <NumberInput
                        label="CPSE ETF / Employee Stock Holdings"
                        value={cpseEtfHoldings}
                        onChange={setCpseEtfHoldings}
                        prefix="₹"
                        step={50000}
                        min={0}
                        max={50000000}
                      />
                    </>
                  )}
                </Section>
              </div>

              {/* Summary in panel */}
              <div className="mt-6 bg-gradient-to-r from-brand-50 to-amber-50 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Retirement Journey
                </div>
                <div className="text-xl font-extrabold gradient-text">
                  {yearsToRetire} years to retire
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Age {safeCurrentAge} &rarr; {retirementAge} &middot; {orgType}
                </div>
              </div>
            </div>

            {/* ─────────────────────── RESULTS PANEL ─────────────────────── */}
            <div className="space-y-8">
              {/* Personalised Banner + PDF */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {clientName ? (
                  <div className="bg-gradient-to-r from-brand-50 via-teal-50 to-amber-50 rounded-xl p-5 border border-brand-200/30 flex-1">
                    <h3 className="text-lg font-extrabold text-primary-700">
                      {clientName}&apos;s PSU Retirement Plan
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {orgType} &middot; Age {safeCurrentAge} &rarr; Retire at {retirementAge}{' '}
                      &middot; {yearsToRetire}-year projection
                    </p>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-700 text-lg">
                      Your PSU Retirement Projection
                    </h3>
                    <p className="text-sm text-slate-500">
                      Based on {orgType} &middot; retiring at {retirementAge}
                    </p>
                  </div>
                )}
                <div data-pdf-hide>
                  <DownloadPDFButton
                    elementId="calculator-results"
                    title="PSU Retirement Plan"
                    fileName={`PSU-Retirement-${clientName || 'Plan'}`}
                  />
                </div>
              </div>

              {/* 1. Hero Corpus Card */}
              <div
                className="card-base p-6 bg-gradient-to-br from-brand-500 via-teal-600 to-primary-700 text-white"
                data-pdf-keep-together
              >
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-5 h-5 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                    {nameOrYour} Retirement Corpus
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                  {formatINR(result.lumpSumCorpus)}
                </div>
                <div className="text-sm text-white/80 mt-1">
                  Total lump sum at age {retirementAge} (in {yearsToRetire} years)
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="text-[10px] text-white/70 uppercase tracking-wider">
                      Tax-Free Portion
                    </div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      {formatINR(result.taxFreeTotal)}
                    </div>
                    <div className="text-[10px] text-white/70 mt-0.5">
                      PF + NPS 60% + Gratuity + Leave + Commuted Pension
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="text-[10px] text-white/70 uppercase tracking-wider">
                      Taxable Portion
                    </div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      {formatINR(result.taxableTotal)}
                    </div>
                    <div className="text-[10px] text-white/70 mt-0.5">
                      Insurance maturity, excess over caps, other
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Benefits Breakdown Pie */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Benefits Breakdown</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Contribution of each stream to {nameOrYour.toLowerCase()} total corpus
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={48} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Year-by-year Growth Area Chart */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">Corpus Build-Up Over Time</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Year-wise growth of PF, VPF &amp; NPS (ex-terminal benefits)
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="psuPfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={STREAM_COLORS.pf} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={STREAM_COLORS.pf} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="psuVpfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={STREAM_COLORS.vpf} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={STREAM_COLORS.vpf} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="psuNpsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={STREAM_COLORS.nps} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={STREAM_COLORS.nps} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="age"
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickFormatter={(v) => `${v}y`}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatINR(v)}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const label =
                            name === 'pf' ? 'EPF' : name === 'vpf' ? 'VPF' : name === 'nps' ? 'NPS' : name;
                          return [formatINR(value), label];
                        }}
                        labelFormatter={(v) => `Age ${v}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="pf"
                        stackId="1"
                        stroke={STREAM_COLORS.pf}
                        fill="url(#psuPfGrad)"
                        strokeWidth={2}
                        name="pf"
                      />
                      {hasVpf && (
                        <Area
                          type="monotone"
                          dataKey="vpf"
                          stackId="1"
                          stroke={STREAM_COLORS.vpf}
                          fill="url(#psuVpfGrad)"
                          strokeWidth={2}
                          name="vpf"
                        />
                      )}
                      {hasNps && (
                        <Area
                          type="monotone"
                          dataKey="nps"
                          stackId="1"
                          stroke={STREAM_COLORS.nps}
                          fill="url(#psuNpsGrad)"
                          strokeWidth={2}
                          name="nps"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Post-retirement cashflow */}
              <div className="card-base p-6" data-pdf-keep-together>
                <h3 className="font-bold text-primary-700 mb-1">
                  Monthly Cashflow After Retirement
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Estimated monthly income from all streams (at age {retirementAge})
                </p>

                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      NPS Annuity
                    </div>
                    <div className="text-lg font-extrabold text-purple-700 mt-1">
                      {formatINR(result.npsMonthlyAnnuity)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {hasNps ? `From ${formatINR(result.npsAnnuityCorpus)} annuity corpus` : 'NPS not enabled'}
                    </div>
                  </div>
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Pension Income
                    </div>
                    <div className="text-lg font-extrabold text-pink-700 mt-1">
                      {formatINR(hasPension ? result.reducedMonthlyPension : 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {hasPension
                        ? commutePension
                          ? 'Reduced (60%) for 15y after commutation'
                          : 'Full monthly pension'
                        : 'Pension not applicable'}
                    </div>
                  </div>
                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Conservative SWP @ 6%
                    </div>
                    <div className="text-lg font-extrabold text-brand-700 mt-1">
                      {formatINR(result.monthlySwp)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      From {formatINR(result.lumpSumCorpus)} lump sum
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary-700 to-brand-600 rounded-xl p-5 text-white">
                  <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1">
                    Total Monthly Income (Nominal)
                  </div>
                  <div className="text-3xl font-extrabold">
                    {formatINR(result.totalMonthlyIncome)}
                  </div>
                </div>

                {/* Inflation-adjusted purchasing power */}
                <div className="mt-5">
                  <div className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">
                    Real Purchasing Power (today&apos;s rupees, 6% inflation)
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { age: 60, val: result.realAt60 },
                      { age: 65, val: result.realAt65 },
                      { age: 70, val: result.realAt70 },
                    ].map((x) => (
                      <div
                        key={x.age}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center"
                      >
                        <div className="text-[10px] text-slate-400 uppercase">At age {x.age}</div>
                        <div className="text-base font-extrabold text-amber-700 mt-0.5">
                          {formatINR(x.val)}
                        </div>
                        <div className="text-[10px] text-slate-400">/month</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Insights */}
              <div className="card-base p-6" data-pdf-keep-together>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-primary-700">Personalised Insights</h3>
                </div>
                <div className="space-y-3">
                  {insights.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-4 rounded-lg border text-sm leading-relaxed',
                        item.tone === 'good' && 'bg-teal-50 border-teal-200 text-teal-900',
                        item.tone === 'warn' && 'bg-red-50 border-red-200 text-red-900',
                        item.tone === 'info' && 'bg-slate-50 border-slate-200 text-slate-700'
                      )}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Year-wise projection table (pdf-hidden) */}
              <div className="card-base overflow-hidden" data-pdf-hide>
                <div className="p-6 pb-0">
                  <h3 className="font-bold text-primary-700 mb-1">
                    Year-wise Contribution Schedule
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Detailed year-by-year view of salary, contributions and corpus build-up
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-300 bg-surface-100">
                        <th className="text-left py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Year
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Age
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Basic (mo)
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          PF Corpus
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          VPF Corpus
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          NPS Corpus
                        </th>
                        <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                          Running Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.chartData.map((row) => (
                        <tr
                          key={row.year}
                          className="border-b border-surface-200 hover:bg-surface-100/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-medium text-primary-700">Yr {row.year}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{row.age}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {formatINR(row.basic)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-teal-700 font-medium">
                            {formatINR(row.pf)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-indigo-700 font-medium">
                            {formatINR(row.vpf)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-purple-700 font-medium">
                            {formatINR(row.nps)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary-700">
                            {formatINR(row.running)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. Supplement with Mutual Fund SIP */}
              <div
                className="card-base p-6 bg-gradient-to-br from-amber-50 to-brand-50 border border-amber-200"
                data-pdf-keep-together
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-brand-700" />
                  <h3 className="font-bold text-primary-700">
                    Supplement With a Mutual Fund SIP
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-5">
                  Bridge the gap between your projected corpus and a truly comfortable retirement
                  income. Enter what you&apos;d like to spend per month in today&apos;s terms — we&apos;ll
                  work out the top-up SIP needed at 12% expected returns.
                </p>

                <div className="mb-5">
                  <NumberInput
                    label="Desired Monthly Income (today's rupees)"
                    value={desiredMonthlyIncome}
                    onChange={setDesiredMonthlyIncome}
                    prefix="₹"
                    step={5000}
                    min={10000}
                    max={500000}
                    hint="Will be inflated @6% p.a. and funded for 25 years post-retirement"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-white rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Desired Corpus
                    </div>
                    <div className="text-lg font-extrabold text-primary-700 mt-1">
                      {formatINR(supplementSIP.desiredCorpus)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatINR(supplementSIP.futureMonthlyIncomeNeed)}/mo × 12 × 25 yrs
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      PSU Corpus (this calc)
                    </div>
                    <div className="text-lg font-extrabold text-teal-700 mt-1">
                      {formatINR(result.lumpSumCorpus)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Lump-sum benefits only
                    </div>
                  </div>
                  <div
                    className={cn(
                      'rounded-xl p-4 border',
                      supplementSIP.shortfall > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-teal-50 border-teal-200'
                    )}
                  >
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {supplementSIP.shortfall > 0 ? 'Shortfall' : 'Surplus'}
                    </div>
                    <div
                      className={cn(
                        'text-lg font-extrabold mt-1',
                        supplementSIP.shortfall > 0 ? 'text-red-600' : 'text-teal-700'
                      )}
                    >
                      {formatINR(Math.abs(supplementSIP.shortfall || (result.lumpSumCorpus - supplementSIP.desiredCorpus)))}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {supplementSIP.shortfall > 0 ? 'Need to bridge' : 'You are ahead!'}
                    </div>
                  </div>
                </div>

                {supplementSIP.shortfall > 0 ? (
                  <div className="bg-gradient-to-r from-brand-500 to-primary-700 rounded-xl p-5 text-white">
                    <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1">
                      Required Mutual Fund SIP (Growth Option, @12% expected)
                    </div>
                    <div className="text-3xl font-extrabold mb-3">
                      {formatINR(supplementSIP.monthlySip)} / month
                    </div>
                    <div className="text-sm text-white/85 mb-4">
                      For {yearsToRetire} years until retirement. Consider a diversified
                      equity + hybrid mutual fund portfolio via your Relationship Manager.
                    </div>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-colors"
                      data-pdf-hide
                    >
                      <MessageCircle className="w-4 h-4" />
                      Talk to Your Relationship Manager
                    </a>
                  </div>
                ) : (
                  <div className="bg-teal-600 rounded-xl p-5 text-white">
                    <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1">
                      You are on track
                    </div>
                    <div className="text-xl font-extrabold mb-2">
                      Your PSU benefits meet your desired income
                    </div>
                    <div className="text-sm text-white/85">
                      Still worth a short review — a mutual fund SIP can add tax-efficient growth and
                      inflation protection to your post-retirement income. Your Relationship Manager
                      at {COMPANY.brand} can help with a Growth-option plan.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed max-w-4xl mx-auto">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
