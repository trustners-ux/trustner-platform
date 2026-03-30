// ─────────────────────────────────────────────────────────
// MFD Trail Commission Calculation Engines
// 8 calculators for distributor business planning
// ─────────────────────────────────────────────────────────

import { INSURANCE_COMMISSION } from '@/lib/constants/trail-commission';

// ── Shared Types ─────────────────────────────────────────

export interface TrailYearlyData {
  year: number;
  aum: number;
  monthlyTrail: number;
  annualTrail: number;
  cumulativeTrail: number;
  totalInvested?: number;
  newSIPsAdded?: number;
  lumpSumAdded?: number;
  activeSIPs?: number;
  phase?: string;
}

export interface TrailResult {
  finalAUM: number;
  finalMonthlyTrail: number;
  finalAnnualTrail: number;
  totalTrailEarned: number;
  totalInvested: number;
  yearly: TrailYearlyData[];
}

export interface InsuranceVsMFData {
  year: number;
  insuranceCommission: number;
  cumulativeInsurance: number;
  mfTrail: number;
  cumulativeMF: number;
  mfAUM: number;
}

export interface TargetResult {
  requiredAUM: number;
  scenarios: {
    years: number;
    requiredMonthlySIP: number;
    requiredNewSIPsPerMonth: number;
    sipAmount: number;
  }[];
}

export interface ScaleProjection {
  clients: number;
  label: string;
  totalMonthlySIP: number;
  yearly: TrailYearlyData[];
  finalAUM: number;
  finalMonthlyTrail: number;
}

// ── Tab 1: New SIP Trail ─────────────────────────────────
// You add X new SIPs per month, each of ₹Y

export function calculateNewSIPTrail(
  newSIPAmount: number,
  newSIPsPerMonth: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): TrailResult {
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = years * 12;
  let aum = 0;
  let cumulativeTrail = 0;
  let totalInvested = 0;
  const yearly: TrailYearlyData[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    // Each month, 'newSIPsPerMonth' new SIPs start.
    // At month m, total active SIPs = newSIPsPerMonth * m
    const activeSIPs = newSIPsPerMonth * m;
    const monthlyInflow = newSIPAmount * activeSIPs;
    totalInvested += monthlyInflow;
    aum = (aum + monthlyInflow) * (1 + monthlyRate);
    const monthlyTrail = (aum * trailPercent) / 100 / 12;
    cumulativeTrail += monthlyTrail;

    if (m % 12 === 0) {
      const year = m / 12;
      yearly.push({
        year,
        aum,
        monthlyTrail,
        annualTrail: monthlyTrail * 12,
        cumulativeTrail,
        totalInvested,
        activeSIPs,
        newSIPsAdded: newSIPsPerMonth * 12,
      });
    }
  }

  const finalMonthlyTrail = yearly.length > 0 ? yearly[yearly.length - 1].monthlyTrail : 0;

  return {
    finalAUM: aum,
    finalMonthlyTrail,
    finalAnnualTrail: finalMonthlyTrail * 12,
    totalTrailEarned: cumulativeTrail,
    totalInvested,
    yearly,
  };
}

// ── Tab 2: Lump Sum Trail ────────────────────────────────
// One-time investment, see how trail grows with market appreciation

export function calculateLumpSumTrail(
  lumpSumAmount: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): TrailResult {
  const yearly: TrailYearlyData[] = [];
  let cumulativeTrail = 0;

  for (let y = 1; y <= years; y++) {
    const aum = lumpSumAmount * Math.pow(1 + expectedReturn / 100, y);
    const annualTrail = (aum * trailPercent) / 100;
    const monthlyTrail = annualTrail / 12;
    cumulativeTrail += annualTrail;

    yearly.push({
      year: y,
      aum,
      monthlyTrail,
      annualTrail,
      cumulativeTrail,
      totalInvested: lumpSumAmount,
    });
  }

  const last = yearly[yearly.length - 1];
  return {
    finalAUM: last?.aum ?? 0,
    finalMonthlyTrail: last?.monthlyTrail ?? 0,
    finalAnnualTrail: last?.annualTrail ?? 0,
    totalTrailEarned: cumulativeTrail,
    totalInvested: lumpSumAmount,
    yearly,
  };
}

// ── Tab 3: SIP Book Growth ───────────────────────────────
// Existing AUM + existing SIP book + new monthly SIPs

export function calculateSIPBookGrowth(
  startingAUM: number,
  existingSIPBook: number,
  newSIPAmount: number,
  newSIPsPerMonth: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): TrailResult {
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = years * 12;
  let aum = startingAUM;
  let cumulativeTrail = 0;
  let totalInvested = startingAUM;
  const yearly: TrailYearlyData[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    // Existing SIPs continue to flow
    const existingInflow = existingSIPBook;
    // New SIPs accumulate: m new batches by month m
    const newInflow = newSIPAmount * newSIPsPerMonth * m;
    const totalInflow = existingInflow + newInflow;
    totalInvested += totalInflow;
    aum = (aum + totalInflow) * (1 + monthlyRate);
    const monthlyTrail = (aum * trailPercent) / 100 / 12;
    cumulativeTrail += monthlyTrail;

    if (m % 12 === 0) {
      const year = m / 12;
      yearly.push({
        year,
        aum,
        monthlyTrail,
        annualTrail: monthlyTrail * 12,
        cumulativeTrail,
        totalInvested,
        activeSIPs: (existingSIPBook / newSIPAmount || 0) + newSIPsPerMonth * m,
      });
    }
  }

  const last = yearly[yearly.length - 1];
  return {
    finalAUM: aum,
    finalMonthlyTrail: last?.monthlyTrail ?? 0,
    finalAnnualTrail: (last?.monthlyTrail ?? 0) * 12,
    totalTrailEarned: cumulativeTrail,
    totalInvested,
    yearly,
  };
}

// ── Tab 4: AUM Growth Only ───────────────────────────────
// Current AUM grows purely from market appreciation, no new business

export function calculateAUMGrowthTrail(
  currentAUM: number,
  aumGrowthRate: number,
  trailPercent: number,
  years: number
): TrailResult {
  const yearly: TrailYearlyData[] = [];
  let cumulativeTrail = 0;

  for (let y = 1; y <= years; y++) {
    const aum = currentAUM * Math.pow(1 + aumGrowthRate / 100, y);
    const annualTrail = (aum * trailPercent) / 100;
    const monthlyTrail = annualTrail / 12;
    cumulativeTrail += annualTrail;

    yearly.push({
      year: y,
      aum,
      monthlyTrail,
      annualTrail,
      cumulativeTrail,
      totalInvested: currentAUM,
    });
  }

  const last = yearly[yearly.length - 1];
  return {
    finalAUM: last?.aum ?? 0,
    finalMonthlyTrail: last?.monthlyTrail ?? 0,
    finalAnnualTrail: last?.annualTrail ?? 0,
    totalTrailEarned: cumulativeTrail,
    totalInvested: currentAUM,
    yearly,
  };
}

// ── Tab 5: Comprehensive Income Projection ───────────────
// Everything combined: existing AUM + SIP book + new SIPs + annual lump sums

export function calculateComprehensiveTrail(
  currentAUM: number,
  currentMonthlySIPBook: number,
  newSIPAmount: number,
  newSIPsPerMonth: number,
  annualLumpSum: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): TrailResult {
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = years * 12;
  let aum = currentAUM;
  let cumulativeTrail = 0;
  let totalInvested = currentAUM;
  const yearly: TrailYearlyData[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const sipInflow = currentMonthlySIPBook;
    const newSIPInflow = newSIPAmount * newSIPsPerMonth * m;
    // Lump sum at start of each year (month 1, 13, 25, ...)
    const lumpSumInflow = m === 1 || m % 12 === 1 ? annualLumpSum : 0;
    const totalInflow = sipInflow + newSIPInflow + lumpSumInflow;
    totalInvested += totalInflow;
    aum = (aum + totalInflow) * (1 + monthlyRate);
    const monthlyTrail = (aum * trailPercent) / 100 / 12;
    cumulativeTrail += monthlyTrail;

    if (m % 12 === 0) {
      const year = m / 12;
      yearly.push({
        year,
        aum,
        monthlyTrail,
        annualTrail: monthlyTrail * 12,
        cumulativeTrail,
        totalInvested,
        activeSIPs: newSIPsPerMonth * m + (currentMonthlySIPBook > 0 ? Math.round(currentMonthlySIPBook / 5000) : 0),
        lumpSumAdded: annualLumpSum,
      });
    }
  }

  const last = yearly[yearly.length - 1];
  return {
    finalAUM: aum,
    finalMonthlyTrail: last?.monthlyTrail ?? 0,
    finalAnnualTrail: (last?.monthlyTrail ?? 0) * 12,
    totalTrailEarned: cumulativeTrail,
    totalInvested,
    yearly,
  };
}

// ── Tab 6: Target Income (Reverse Calculator) ────────────
// "I want ₹X/month trail" → what AUM & new SIPs are needed?

export function calculateTargetIncome(
  targetMonthlyTrail: number,
  trailPercent: number,
  expectedReturn: number,
  newSIPAmount: number
): TargetResult {
  const requiredAUM = (targetMonthlyTrail * 12) / (trailPercent / 100);

  const timeframes = [3, 5, 7, 10, 15, 20];
  const monthlyRate = expectedReturn / 100 / 12;

  const scenarios = timeframes.map((years) => {
    const months = years * 12;
    // Binary search for required new SIPs/month
    // AUM at month m = sum of all monthly inflows compounded
    // Each month m has inflow = newSIPAmount * newSIPsPerMonth * m
    // We need to find newSIPsPerMonth such that final AUM = requiredAUM

    let low = 0;
    let high = 500;
    let bestSIPs = 0;

    for (let iter = 0; iter < 50; iter++) {
      const mid = (low + high) / 2;
      let aum = 0;
      for (let m = 1; m <= months; m++) {
        const inflow = newSIPAmount * mid * m;
        aum = (aum + inflow) * (1 + monthlyRate);
      }
      if (aum < requiredAUM) {
        low = mid;
      } else {
        high = mid;
        bestSIPs = mid;
      }
    }

    const requiredNewSIPs = Math.ceil(bestSIPs);
    const requiredMonthlySIP = requiredNewSIPs * newSIPAmount;

    return {
      years,
      requiredMonthlySIP: requiredMonthlySIP,
      requiredNewSIPsPerMonth: requiredNewSIPs,
      sipAmount: newSIPAmount,
    };
  });

  return { requiredAUM, scenarios };
}

// ── Tab 7: Insurance vs MF Comparison ────────────────────
// Compare insurance agent commission vs MFD trail income

export function calculateInsuranceVsMF(
  annualPremium: number,
  policyTerm: number,
  mfTrailPercent: number,
  mfReturn: number,
  years: number
): { data: InsuranceVsMFData[]; crossoverYear: number | null } {
  const data: InsuranceVsMFData[] = [];
  let cumulativeInsurance = 0;
  let cumulativeMF = 0;
  let crossoverYear: number | null = null;
  let mfAUM = 0;

  for (let y = 1; y <= years; y++) {
    // Insurance commission
    let insuranceCommission = 0;
    if (y <= policyTerm) {
      if (y === 1) {
        insuranceCommission = annualPremium * INSURANCE_COMMISSION.year1;
      } else if (y <= 3) {
        insuranceCommission = annualPremium * INSURANCE_COMMISSION.year2to3;
      } else {
        insuranceCommission = annualPremium * INSURANCE_COMMISSION.year4plus;
      }
    }
    cumulativeInsurance += insuranceCommission;

    // MF trail — same premium invested annually in MF
    if (y <= policyTerm) {
      mfAUM = (mfAUM + annualPremium) * (1 + mfReturn / 100);
    } else {
      mfAUM = mfAUM * (1 + mfReturn / 100);
    }
    const mfTrail = (mfAUM * mfTrailPercent) / 100;
    cumulativeMF += mfTrail;

    if (crossoverYear === null && cumulativeMF > cumulativeInsurance) {
      crossoverYear = y;
    }

    data.push({
      year: y,
      insuranceCommission,
      cumulativeInsurance,
      mfTrail,
      cumulativeMF,
      mfAUM,
    });
  }

  return { data, crossoverYear };
}

// ── Tab 8: Sub-Broker Scale Projection ───────────────────
// Project business at different client scales

export function calculateSubBrokerScale(
  numberOfClients: number,
  avgSIPPerClient: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): TrailResult {
  const totalMonthlySIP = numberOfClients * avgSIPPerClient;
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = years * 12;
  let aum = 0;
  let cumulativeTrail = 0;
  let totalInvested = 0;
  const yearly: TrailYearlyData[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    totalInvested += totalMonthlySIP;
    aum = (aum + totalMonthlySIP) * (1 + monthlyRate);
    const monthlyTrail = (aum * trailPercent) / 100 / 12;
    cumulativeTrail += monthlyTrail;

    if (m % 12 === 0) {
      const year = m / 12;
      yearly.push({
        year,
        aum,
        monthlyTrail,
        annualTrail: monthlyTrail * 12,
        cumulativeTrail,
        totalInvested,
        activeSIPs: numberOfClients,
      });
    }
  }

  const last = yearly[yearly.length - 1];
  return {
    finalAUM: aum,
    finalMonthlyTrail: last?.monthlyTrail ?? 0,
    finalAnnualTrail: (last?.monthlyTrail ?? 0) * 12,
    totalTrailEarned: cumulativeTrail,
    totalInvested,
    yearly,
  };
}

// ── Multi-scale projection helper for Tab 8 ──────────────

export function calculateMultiScaleProjection(
  clientPresets: { clients: number; label: string }[],
  avgSIPPerClient: number,
  expectedReturn: number,
  trailPercent: number,
  years: number
): ScaleProjection[] {
  return clientPresets.map((preset) => {
    const result = calculateSubBrokerScale(
      preset.clients,
      avgSIPPerClient,
      expectedReturn,
      trailPercent,
      years
    );
    return {
      clients: preset.clients,
      label: preset.label,
      totalMonthlySIP: preset.clients * avgSIPPerClient,
      yearly: result.yearly,
      finalAUM: result.finalAUM,
      finalMonthlyTrail: result.finalMonthlyTrail,
    };
  });
}
