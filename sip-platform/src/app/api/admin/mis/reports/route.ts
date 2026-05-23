import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { verifyEmployeeToken } from '@/lib/auth/employee-jwt';
import { canAccess, type AdminRole } from '@/lib/auth/config';
import { EMPLOYEES } from '@/lib/mis/employee-data';
import { getBusinessEntries } from '@/lib/dal/business-entries';
import { getPartnerStats, listPartners } from '@/lib/dal/partners';
import type { MonthlyBusinessEntry } from '@/lib/mis/types';

async function getAuthUser(): Promise<{ email: string; name: string; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin-session')?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return { email: payload.email as string, name: payload.name as string, role: payload.role as AdminRole };
  }
  const empToken = cookieStore.get('employee-session')?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      const roleMap: Record<string, AdminRole> = { bod: 'super_admin', cdo: 'admin', regional_manager: 'hr', branch_head: 'hr', cdm: 'editor', manager: 'editor' };
      return { email: payload.email as string, name: payload.name as string, role: roleMap[payload.role as string] || 'viewer' };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !canAccess(user.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const report = searchParams.get('report') || 'monthly_summary';
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  try {
    if (report === 'monthly_summary') {
      const entries = await getBusinessEntries({ month, status: 'approved' });
      const totalRaw = entries.reduce((s: number, e: MonthlyBusinessEntry) => s + e.rawAmount, 0);
      const totalWeighted = entries.reduce((s: number, e: MonthlyBusinessEntry) => s + e.weightedAmount, 0);

      // Group by employee
      const byEmployee: Record<number, { name: string; raw: number; weighted: number; count: number }> = {};
      entries.forEach((e: MonthlyBusinessEntry) => {
        const emp = EMPLOYEES.find(em => em.id === e.employeeId);
        if (!byEmployee[e.employeeId]) {
          byEmployee[e.employeeId] = { name: emp?.name || `Employee ${e.employeeId}`, raw: 0, weighted: 0, count: 0 };
        }
        byEmployee[e.employeeId].raw += e.rawAmount;
        byEmployee[e.employeeId].weighted += e.weightedAmount;
        byEmployee[e.employeeId].count += 1;
      });

      const employeeList = Object.entries(byEmployee)
        .map(([id, data]) => {
          const emp = EMPLOYEES.find(e => e.id === parseInt(id));
          const target = emp?.monthlyTarget || 200000;
          const achievementPct = target > 0 ? Math.round(data.weighted / target * 10000) / 100 : 0;
          return { employeeId: parseInt(id), ...data, target, achievementPct };
        })
        .sort((a, b) => b.achievementPct - a.achievementPct);

      return NextResponse.json({
        month,
        totalEntries: entries.length,
        totalRawBusiness: totalRaw,
        totalWeightedBusiness: totalWeighted,
        activeEmployees: Object.keys(byEmployee).length,
        topPerformers: employeeList.slice(0, 10),
        bottomPerformers: employeeList.filter(e => e.achievementPct < 80).slice(-5),
        byEmployee: employeeList,
      });
    }

    if (report === 'partner_performance') {
      const stats = getPartnerStats();
      const partners = listPartners({ isActive: true });
      return NextResponse.json({ stats, partners });
    }

    if (report === 'channel_comparison') {
      const entries = await getBusinessEntries({ month });
      const channels: Record<string, { volume: number; count: number; payout: number }> = {
        Direct: { volume: 0, count: 0, payout: 0 },
        POSP: { volume: 0, count: 0, payout: 0 },
        BQP: { volume: 0, count: 0, payout: 0 },
        Franchise: { volume: 0, count: 0, payout: 0 },
        Referral: { volume: 0, count: 0, payout: 0 },
      };
      entries.forEach((e: MonthlyBusinessEntry) => {
        const ch = e.partnerType || (e.channelPayoutPct === 0 ? 'Direct' : 'POSP');
        if (!channels[ch]) channels[ch] = { volume: 0, count: 0, payout: 0 };
        channels[ch].volume += e.rawAmount;
        channels[ch].count += 1;
        channels[ch].payout += e.rawAmount * (e.channelPayoutPct / 100);
      });
      return NextResponse.json({ month, channels });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
