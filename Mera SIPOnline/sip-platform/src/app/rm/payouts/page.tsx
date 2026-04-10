'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee, Loader2, AlertCircle, TrendingUp, Award, Calendar,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Zap,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import { RMNav } from '@/components/rm/RMNav';

interface UserInfo {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  entity: string;
  segment: string;
}

interface PayoutRecord {
  month: string;
  achievementPct: number;
  slabLabel: string;
  incentiveRate: number;
  grossIncentive: number;
  deductions: number;
  netPayout: number;
  trailIncome: number;
  totalPayout: number;
  status: 'pending' | 'processing' | 'paid';
  weightedBusiness: number;
  rawBusiness: number;
  target: number;
}

interface ClawbackAlert {
  id: number;
  clientName: string;
  type: 'sip_stopped' | 'lumpsum_redeemed';
  amount: number;
  clawbackImpact: number;
  date: string;
}

// ─── Seed Data ───
function generateSeedPayouts(employeeId: number): PayoutRecord[] {
  const months = [
    '2026-04', '2026-03', '2026-02', '2026-01', '2025-12', '2025-11',
    '2025-10', '2025-09', '2025-08', '2025-07', '2025-06', '2025-05',
  ];
  const statuses: PayoutRecord['status'][] = ['pending', 'processing', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid'];
  const achievements = [112, 98, 135, 88, 105, 72, 155, 120, 95, 110, 130, 145];
  const targets = [200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000];

  return months.map((month, i) => {
    const ach = achievements[i];
    const target = targets[i];
    const weighted = Math.round(target * ach / 100);
    const raw = Math.round(weighted * 1.8);
    let rate = 0;
    let slabLabel = 'No Incentive';
    if (ach > 150) { rate = 8; slabLabel = 'Champion 8%'; }
    else if (ach > 125) { rate = 6; slabLabel = 'Super 6%'; }
    else if (ach > 100) { rate = 5; slabLabel = 'Enhanced 5%'; }
    else if (ach > 80) { rate = 4; slabLabel = 'Base 4%'; }
    const gross = Math.round(weighted * rate / 100);
    const deductions = i < 2 ? 0 : (i === 5 ? 2500 : 0);
    const trail = Math.round(1500 + Math.random() * 3000);

    return {
      month,
      achievementPct: ach,
      slabLabel,
      incentiveRate: rate,
      grossIncentive: gross,
      deductions,
      netPayout: gross - deductions,
      trailIncome: trail,
      totalPayout: gross - deductions + trail,
      status: statuses[i],
      weightedBusiness: weighted,
      rawBusiness: raw,
      target,
    };
  });
}

const SEED_CLAWBACKS: ClawbackAlert[] = [
  { id: 1, clientName: 'Ramesh Gupta', type: 'sip_stopped', amount: 5000, clawbackImpact: 1250, date: '2026-03-15' },
];

function formatMonth(m: string): string {
  const [y, mo] = m.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(mo)]} ${y}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    processing: <Loader2 className="w-3 h-3 animate-spin" />,
    paid: <CheckCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || styles.pending}`}>
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function PayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [clawbacks] = useState<ClawbackAlert[]>(SEED_CLAWBACKS);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const authRes = await fetch('/api/rm/auth');
        if (!authRes.ok) { router.push('/admin/login'); return; }
        const { user: u } = await authRes.json();
        setUser(u);
        setPayouts(generateSeedPayouts(u.employeeId));
      } catch { router.push('/admin/login'); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
    );
  }

  const currentPayout = payouts[0];
  const paidPayouts = payouts.filter(p => p.status === 'paid');
  const last3Avg = paidPayouts.length >= 3
    ? Math.round(paidPayouts.slice(0, 3).reduce((s, p) => s + p.totalPayout, 0) / 3)
    : paidPayouts.length > 0
    ? Math.round(paidPayouts.reduce((s, p) => s + p.totalPayout, 0) / paidPayouts.length)
    : 0;
  const bestMonth = paidPayouts.length > 0
    ? paidPayouts.reduce((best, p) => p.totalPayout > best.totalPayout ? p : best, paidPayouts[0])
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <RMNav userName={user.name} designation={user.designation} entity={user.entity} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-lg font-bold text-slate-800 mb-4">My Payouts</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Month</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {currentPayout?.status === 'paid' ? formatINR(currentPayout.totalPayout) : 'Pending'}
            </p>
            <StatusBadge status={currentPayout?.status || 'pending'} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last 3 Months Avg</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatINR(last3Avg)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500"><TrendingUp className="w-5 h-5 text-white" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Best Month</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{bestMonth ? formatINR(bestMonth.totalPayout) : '—'}</p>
                {bestMonth && <p className="text-xs text-slate-400 mt-1">{formatMonth(bestMonth.month)}</p>}
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500"><Award className="w-5 h-5 text-white" /></div>
            </div>
          </div>
        </div>

        {/* Clawback Alerts */}
        {clawbacks.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-red-700">Clawback Alerts</h3>
            </div>
            {clawbacks.map(cb => (
              <div key={cb.id} className="flex items-center justify-between py-2 border-t border-red-100 first:border-t-0">
                <div>
                  <p className="text-sm text-red-800 font-medium">{cb.clientName}</p>
                  <p className="text-xs text-red-600">
                    {cb.type === 'sip_stopped' ? 'SIP Stopped' : 'Lumpsum Redeemed'} on {cb.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-700">-{formatINR(cb.clawbackImpact)}</p>
                  <p className="text-[10px] text-red-500">from {formatINR(cb.amount)} policy</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-red-500 mt-2">Contact your manager for details about clawback calculations.</p>
          </div>
        )}

        {/* Payout History */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" /> Payout History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Month</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Achievement</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Slab</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Net Payout</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Trail</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <>
                    <tr key={p.month} className="border-t border-slate-100 hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => setExpandedMonth(expandedMonth === p.month ? null : p.month)}>
                      <td className="px-4 py-3 font-medium text-slate-700">{formatMonth(p.month)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.achievementPct > 150 ? 'bg-purple-100 text-purple-700' :
                          p.achievementPct > 100 ? 'bg-emerald-100 text-emerald-700' :
                          p.achievementPct > 80 ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {p.achievementPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.slabLabel}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(p.netPayout)}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">{formatINR(p.trailIncome)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatINR(p.totalPayout)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        {expandedMonth === p.month ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                    </tr>
                    {expandedMonth === p.month && (
                      <tr key={`${p.month}-detail`} className="bg-slate-50/80">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Target</p>
                              <p className="text-sm font-bold text-slate-700">{formatINR(p.target)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Weighted Business</p>
                              <p className="text-sm font-bold text-slate-700">{formatINR(p.weightedBusiness)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Raw Business</p>
                              <p className="text-sm font-bold text-slate-700">{formatINR(p.rawBusiness)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Deductions</p>
                              <p className={`text-sm font-bold ${p.deductions > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                {p.deductions > 0 ? `-${formatINR(p.deductions)}` : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Gross Incentive</p>
                              <p className="text-sm font-medium text-slate-700">{formatINR(p.grossIncentive)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Trail Income</p>
                              <p className="text-sm font-medium text-emerald-600">{formatINR(p.trailIncome)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Total Payout</p>
                              <p className="text-sm font-bold text-slate-800">{formatINR(p.totalPayout)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
