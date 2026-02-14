/**
 * SIP Future Value Calculator
 * FV = P × [(1+r)^n - 1] / r × (1+r)
 */
export function calculateSIP(
  monthlyAmount: number,
  annualReturn: number,
  years: number
): { totalInvested: number; estimatedReturns: number; totalValue: number } {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    const totalInvested = monthlyAmount * months;
    return { totalInvested, estimatedReturns: 0, totalValue: totalInvested };
  }

  const totalValue =
    monthlyAmount *
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate));
  const totalInvested = monthlyAmount * months;
  const estimatedReturns = totalValue - totalInvested;

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
  };
}

/**
 * SIP year-by-year breakdown for charts
 */
export function calculateSIPBreakdown(
  monthlyAmount: number,
  annualReturn: number,
  years: number
): { year: number; invested: number; value: number }[] {
  const monthlyRate = annualReturn / 100 / 12;
  const result: { year: number; invested: number; value: number }[] = [];

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const invested = monthlyAmount * months;
    let value: number;

    if (monthlyRate === 0) {
      value = invested;
    } else {
      value =
        monthlyAmount *
        (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
          (1 + monthlyRate));
    }

    result.push({
      year: y,
      invested: Math.round(invested),
      value: Math.round(value),
    });
  }

  return result;
}

/**
 * Lumpsum Future Value Calculator
 * FV = PV × (1+r)^n
 */
export function calculateLumpsum(
  principal: number,
  annualReturn: number,
  years: number
): { totalInvested: number; estimatedReturns: number; totalValue: number } {
  const totalValue = principal * Math.pow(1 + annualReturn / 100, years);
  const estimatedReturns = totalValue - principal;

  return {
    totalInvested: Math.round(principal),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
  };
}

/**
 * SWP Calculator - how long corpus lasts with regular withdrawals
 */
export function calculateSWP(
  corpus: number,
  monthlyWithdrawal: number,
  annualReturn: number,
  years: number
): { year: number; remaining: number; withdrawn: number }[] {
  const monthlyRate = annualReturn / 100 / 12;
  let remaining = corpus;
  const result: { year: number; remaining: number; withdrawn: number }[] = [];

  for (let y = 1; y <= years; y++) {
    let yearWithdrawn = 0;
    for (let m = 0; m < 12; m++) {
      remaining = remaining * (1 + monthlyRate) - monthlyWithdrawal;
      yearWithdrawn += monthlyWithdrawal;
      if (remaining <= 0) {
        remaining = 0;
        break;
      }
    }
    result.push({
      year: y,
      remaining: Math.round(Math.max(0, remaining)),
      withdrawn: Math.round(yearWithdrawn),
    });
    if (remaining <= 0) break;
  }

  return result;
}
