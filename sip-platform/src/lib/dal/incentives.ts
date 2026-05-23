// ─── Incentives DAL ───
// Connects business entries to the incentive calculation engine

import { getCurrentMonth } from '@/lib/db/config';
import { getBusinessEntries } from './business-entries';
import { getEmployeeById } from './employees';
import {
  calculateMonthlyIncentive,
  getNextSlabInfo,
  getSlabTable,
  formatINR,
} from '@/lib/mis/incentive-engine';
import { MonthlyIncentiveCalc, DashboardData, PerformanceStatus } from '@/lib/mis/types';

/**
 * Calculate live (real-time) incentive for an employee's month
 */
export async function calculateLiveIncentive(
  employeeId: number,
  month?: string
): Promise<MonthlyIncentiveCalc | null> {
  const m = month || getCurrentMonth();
  const employee = await getEmployeeById(employeeId);
  if (!employee || employee.monthlyTarget === 0) return null;

  const allEntries = await getBusinessEntries({ employeeId, month: m });

  // Only count approved and submitted entries for incentive calculation
  // Draft, rejected, and error entries must NOT count toward achievement
  const entries = allEntries.filter(
    e => e.status === 'approved' || e.status === 'submitted'
  );

  if (entries.length === 0) {
    // Return zero calculation
    return {
      employeeId,
      employeeName: employee.name,
      month: m,
      monthlyTarget: employee.monthlyTarget,
      totalRawBusiness: 0,
      totalWeightedBusiness: 0,
      sipClawbackDebit: 0,
      netWeightedBusiness: 0,
      achievementPct: 0,
      applicableSlab: getSlabTable(employee),
      slabLabel: 'No Incentive',
      incentiveRate: 0,
      grossIncentive: 0,
      complianceFactor: 1,
      netIncentive: 0,
      trailIncome: 0,
      recruitmentBonus: 0,
      activationBonus: 0,
      motorIncentive: 0,
      referralCreditAmount: 0,
      totalPayout: 0,
      performanceStatus: 'No Incentive',
    };
  }

  return calculateMonthlyIncentive(employee, entries);
}

/**
 * Get full dashboard data for an RM
 */
export async function getDashboardData(
  employeeId: number,
  month?: string
): Promise<DashboardData | null> {
  const m = month || getCurrentMonth();
  const employee = await getEmployeeById(employeeId);
  if (!employee) return null;

  const entries = await getBusinessEntries({ employeeId, month: m });
  const incentive = await calculateLiveIncentive(employeeId, m);

  if (!incentive) return null;

  const slabTable = getSlabTable(employee);
  const nextSlab = getNextSlabInfo(
    incentive.achievementPct,
    incentive.netWeightedBusiness,
    employee.monthlyTarget,
    slabTable
  );

  // Generate mock performance history (last 6 months)
  // In production, this comes from monthly_incentive_snapshots table
  const performanceHistory = generatePerformanceHistory(employeeId, m);

  return {
    employee,
    currentMonth: incentive,
    businessEntries: entries,
    trailPortfolio: [], // TODO: from trail_income table
    nextSlabInfo: nextSlab,
    performanceHistory,
  };
}

/**
 * Get team performance for a manager
 */
export async function getTeamPerformance(
  managerEmployeeIds: number[],
  month?: string
): Promise<MonthlyIncentiveCalc[]> {
  const results: MonthlyIncentiveCalc[] = [];
  for (const empId of managerEmployeeIds) {
    const calc = await calculateLiveIncentive(empId, month);
    if (calc) results.push(calc);
  }
  return results.sort((a, b) => b.achievementPct - a.achievementPct);
}

/**
 * Get company-wide leaderboard
 */
export async function getCompanyLeaderboard(month?: string): Promise<{
  employeeId: number;
  employeeName: string;
  achievementPct: number;
  performanceStatus: PerformanceStatus;
  totalPayout: number;
}[]> {
  // Get all employees with targets
  const { getEmployees } = await import('./employees');
  const employees = await getEmployees({ isActive: true });
  const salesEmps = employees.filter(e => e.monthlyTarget > 0);

  const results = await Promise.all(
    salesEmps.map(async (emp) => {
      const calc = await calculateLiveIncentive(emp.id, month);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        achievementPct: calc?.achievementPct || 0,
        performanceStatus: calc?.performanceStatus || ('No Incentive' as PerformanceStatus),
        totalPayout: calc?.totalPayout || 0,
      };
    })
  );

  return results.sort((a, b) => b.achievementPct - a.achievementPct);
}

// ─── Helper: Generate mock performance history for demo ───
function generatePerformanceHistory(
  employeeId: number,
  currentMonth: string
): DashboardData['performanceHistory'] {
  const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  const seed = employeeId * 17; // deterministic per employee

  return months.map((month, i) => {
    const base = 70 + ((seed + i * 13) % 60); // 70-130 range
    const pct = Math.round(base * 10) / 10;
    const status: PerformanceStatus =
      pct > 150 ? 'Champion' :
      pct > 125 ? 'Star' :
      pct > 80 ? 'Achiever' :
      pct > 0 ? 'Below Target' : 'No Incentive';

    return {
      month,
      achievementPct: pct,
      totalPayout: Math.round(pct * 100 + (seed % 500)),
      status,
    };
  });
}
